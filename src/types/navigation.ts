
export type RootStackParamList = {
  Workout: undefined;
  WorkoutComplete: {
    distance: string;
    duration: number;
    routeCoordinates: Array<{
      latitude: number;
      longitude: number;
      timestamp?: number;
    }>;
  };
};
