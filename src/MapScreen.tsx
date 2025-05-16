import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, Platform } from 'react-native';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './src/types/navigation';


type MapScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Map'>;

interface LocationCoordinate {
  latitude: number;
  longitude: number;
  timestamp?: number;
}

const MapScreen = () => {
  const navigation = useNavigation<MapScreenNavigationProp>();
  const mapRef = useRef<MapView | null>(null);
  
  // State variables
  const [location, setLocation] = useState<LocationCoordinate | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<LocationCoordinate[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [distance, setDistance] = useState(0);
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

  // Request location permissions when component mounts
  useEffect(() => {
    (async () => {
      try {
        // Request foreground location permissions
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          Alert.alert(
            'Location Permission Required',
            'This app needs location permission to track your workouts.',
            [{ text: 'OK' }]
          );
          return;
        }

        // Get current location
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
        });
        
        const initialLocation = {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          timestamp: currentLocation.timestamp,
        };
        
        setLocation(initialLocation);
        
        // Center map on current location
        mapRef.current?.animateToRegion({
          latitude: initialLocation.latitude,
          longitude: initialLocation.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
      } catch (error) {
        console.error('Error getting location:', error);
        setErrorMsg('Error getting location');
      }
    })();

    // Cleanup function
    return () => {
      stopLocationTracking();
    };
  }, []);

  // Haversine formula to calculate distance between two coordinates in kilometers
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
  };

  // Convert degrees to radians
  const deg2rad = (deg: number): number => {
    return deg * (Math.PI / 180);
  };

  // Start tracking location
  const startLocationTracking = async () => {
    try {
      // Set up location subscription with high accuracy
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 5, // Update every 5 meters
          timeInterval: 1000, // Update every 1 second
        },
        (newLocation) => {
          const newCoordinate = {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
            timestamp: newLocation.timestamp,
          };

          setLocation(newCoordinate);
          
          // Update route coordinates
          setRouteCoordinates((prevCoordinates) => {
            const updatedCoordinates = [...prevCoordinates, newCoordinate];
            
            // Calculate new distance if we have at least two points
            if (updatedCoordinates.length >= 2) {
              const lastIndex = updatedCoordinates.length - 1;
              const newDistance = calculateDistance(
                updatedCoordinates[lastIndex - 1].latitude,
                updatedCoordinates[lastIndex - 1].longitude,
                updatedCoordinates[lastIndex].latitude,
                updatedCoordinates[lastIndex].longitude
              );
              
              setDistance((prevDistance) => prevDistance + newDistance);
            }
            
            return updatedCoordinates;
          });
          
          // Center map on current location
          mapRef.current?.animateToRegion({
            latitude: newCoordinate.latitude,
            longitude: newCoordinate.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          });
        }
      );
      
      setLocationSubscription(subscription);
      
      // Start timer
      const now = Date.now();
      setStartTime(now);
      
      // Update elapsed time every second
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - now) / 1000));
      }, 1000);
      
      setTimerInterval(interval);
      
      // Set tracking state
      setIsTracking(true);
    } catch (error) {
      console.error('Error starting location tracking:', error);
      Alert.alert('Error', 'Failed to start location tracking');
    }
  };

  // Stop tracking location
  const stopLocationTracking = () => {
    // Remove location subscription
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }
    
    // Clear timer interval
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    
    // Set tracking state
    setIsTracking(false);
  };

  // Handle start/stop button press
  const handleTrackingToggle = () => {
    if (isTracking) {
      stopLocationTracking();
      
      // Navigate to workout complete screen with stats
      navigation.navigate('WorkoutComplete', {
        distance: distance.toFixed(2),
        duration: elapsedTime,
        routeCoordinates: routeCoordinates,
      });
      
      // Reset state for next workout
      setRouteCoordinates([]);
      setElapsedTime(0);
      setDistance(0);
      setStartTime(null);
    } else {
      startLocationTracking();
    }
  };

  // Format time display (MM:SS)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {location ? (
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
        >
          {/* Display route as polyline */}
          {routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor="#FF0000"
              strokeWidth={4}
            />
          )}
        </MapView>
      ) : (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            {errorMsg || 'Loading map...'}
          </Text>
        </View>
      )}
      
      {/* Stats display */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Distance</Text>
          <Text style={styles.statValue}>{distance.toFixed(2)} km</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Time</Text>
          <Text style={styles.statValue}>{formatTime(elapsedTime)}</Text>
        </View>
      </View>
      
      {/* Start/Stop button */}
      <TouchableOpacity
        style={[
          styles.trackingButton,
          isTracking ? styles.stopButton : styles.startButton,
        ]}
        onPress={handleTrackingToggle}
      >
        <Text style={styles.buttonText}>
          {isTracking ? 'STOP' : 'START'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
  statsContainer: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingVertical: 10,
    borderRadius: 10,
    marginHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  trackingButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default MapScreen;