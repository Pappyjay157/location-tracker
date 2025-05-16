import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './src/types/navigation';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

type WorkoutCompleteRouteProp = RouteProp<RootStackParamList, 'WorkoutComplete'>;
type WorkoutCompleteNavigationProp = NativeStackNavigationProp<RootStackParamList, 'WorkoutComplete'>;

const WorkoutComplete = () => {
  const navigation = useNavigation<WorkoutCompleteNavigationProp>();
  const route = useRoute<WorkoutCompleteRouteProp>();
  
  // Get workout stats from route params
  const { distance, duration, routeCoordinates } = route.params;
  
  // Calculate average pace (min/km)
  const calculatePace = (): string => {
    if (parseFloat(distance) === 0) return '00:00';
    
    const paceInSeconds = duration / parseFloat(distance);
    const minutes = Math.floor(paceInSeconds / 60);
    const seconds = Math.floor(paceInSeconds % 60);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Format duration (MM:SS)
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Calculate map region to fit the entire route
  const getMapRegion = () => {
    if (routeCoordinates.length === 0) {
      return {
        latitude: 0,
        longitude: 0,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }
    
    let minLat = routeCoordinates[0].latitude;
    let maxLat = routeCoordinates[0].latitude;
    let minLng = routeCoordinates[0].longitude;
    let maxLng = routeCoordinates[0].longitude;
    
    routeCoordinates.forEach(coord => {
      minLat = Math.min(minLat, coord.latitude);
      maxLat = Math.max(maxLat, coord.latitude);
      minLng = Math.min(minLng, coord.longitude);
      maxLng = Math.max(maxLng, coord.longitude);
    });
    
    const midLat = (minLat + maxLat) / 2;
    const midLng = (minLng + maxLng) / 2;
    
    // Add some padding
    const latDelta = (maxLat - minLat) * 1.2 || 0.01;
    const lngDelta = (maxLng - minLng) * 1.2 || 0.01;
    
    return {
      latitude: midLat,
      longitude: midLng,
      latitudeDelta: Math.max(latDelta, 0.01),
      longitudeDelta: Math.max(lngDelta, 0.01),
    };
  };
  
  // Handle new workout button press
  const handleNewWorkout = () => {
    navigation.navigate('Map');
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Workout Complete!</Text>
      </View>
      
      {/* Map summary */}
      {routeCoordinates.length > 0 && (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={getMapRegion()}
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
          >
            <Polyline
              coordinates={routeCoordinates}
              strokeColor="#FF0000"
              strokeWidth={4}
            />
          </MapView>
        </View>
      )}
      
      {/* Stats summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{distance} km</Text>
          <Text style={styles.statLabel}>Distance</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{formatDuration(duration)}</Text>
          <Text style={styles.statLabel}>Duration</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{calculatePace()} min/km</Text>
          <Text style={styles.statLabel}>Avg. Pace</Text>
        </View>
      </View>
      
      {/* Additional stats */}
      <View style={styles.additionalStats}>
        <Text style={styles.additionalStatsTitle}>Workout Details</Text>
        <View style={styles.additionalStatRow}>
          <Text style={styles.additionalStatLabel}>Total Time:</Text>
          <Text style={styles.additionalStatValue}>{formatDuration(duration)}</Text>
        </View>
        <View style={styles.additionalStatRow}>
          <Text style={styles.additionalStatLabel}>Total Distance:</Text>
          <Text style={styles.additionalStatValue}>{distance} km</Text>
        </View>
        <View style={styles.additionalStatRow}>
          <Text style={styles.additionalStatLabel}>Average Pace:</Text>
          <Text style={styles.additionalStatValue}>{calculatePace()} min/km</Text>
        </View>
        <View style={styles.additionalStatRow}>
          <Text style={styles.additionalStatLabel}>Waypoints:</Text>
          <Text style={styles.additionalStatValue}>{routeCoordinates.length}</Text>
        </View>
      </View>
      
      {/* New workout button */}
      <TouchableOpacity style={styles.button} onPress={handleNewWorkout}>
        <Text style={styles.buttonText}>Start New Workout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  mapContainer: {
    height: 200,
    margin: 15,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginHorizontal: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  additionalStats: {
    backgroundColor: 'white',
    margin: 15,
    borderRadius: 10,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  additionalStatsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  additionalStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  additionalStatLabel: {
    fontSize: 16,
    color: '#666',
  },
  additionalStatValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  button: {
    backgroundColor: '#4CAF50',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default WorkoutComplete;