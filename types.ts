import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';


export interface Step {
  id: string;
  roadtripId: string;
  type: string;
  name: string;
  address: string;
  arrivalDateTime: string;
  departureDateTime: string;
  notes: string;
  thumbnail?: File;
  latitude?: number;
  longitude?: number;
  accommodations?: Accommodation[];
  activities?: Activity[];
}

export interface Accommodation {
  _id: string;
  name: string;
  address: string;
  website?: string;
  phone?: string;
  email?: string;
  reservationNumber?: string;
  confirmationDateTime?: string;
  arrivalDateTime: string;
  departureDateTime: string;
  nights?: number;
  price?: string;
  notes?: string;
  thumbnail?: File;
  photos?: File[];
  documents?: File[];
}

export interface Activity {
  _id: string;
  name: string;
  address: string;
  website?: string;
  phone?: string;
  email?: string;
  reservationNumber?: string;
  confirmationDateTime?: string;
  startDateTime: string;
  endDateTime: string;
  price?: string;
  notes?: string;
  thumbnail?: File;
  photos?: File[];
  documents?: File[];
}

export interface File {
  type: string;
  name: string;
  url: string;
}


export interface Roadtrip {
  idRoadtrip: string;
  name: string;
  steps: Step[];
}

export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  RoadTrips: { refresh?: () => void };
  RoadTrip: { roadtripId: string };
  EditRoadTrip: { roadtripId?: string };
  CreateStep: { roadtripId: string; refresh: () => void };
  Step: {
    type: string;
    roadtripId: string;
    stepId: string;
    refresh: () => void;
  };
  Stage: {
    type: 'stage';
    roadtripId: string;
    stepId: string;
    refresh: () => void;
  };
  Stop: {
    type: 'stop';
    roadtripId: string;
    stepId: string;
    refresh: () => void;
  };
  EditStepInfo: {
    step: Step;
    refresh: () => void;
  };
  EditStageInfo: {
    stage: Step;
    refresh: () => void;
  };
  EditStopInfo: {
    stop: Step;
    refresh: () => void;
  };
  EditAccommodation: {
    step: Step;
    accommodation: Accommodation;
    refresh: () => void;

  };
  EditActivity: {
    step: Step;
    activity: Activity;
    refresh: () => void;

  };
  Errors: {
    roadtripId: string;
    errors: { message: string, stepId: string, stepType: string }[];
  };
  WebView: { url: string };
  Maps: undefined;
};

// Types pour les props de navigation et de route
export type StepScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Step'>;
export type StepScreenRouteProp = RouteProp<RootStackParamList, 'Step'>;
export type StepScreenProps = {
  navigation: StepScreenNavigationProp;
  route: StepScreenRouteProp;
};

export type StageScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Stage'>;
export type StageScreenRouteProp = RouteProp<RootStackParamList, 'Stage'>;
export type StageScreenProps = {
  navigation: StageScreenNavigationProp;
  route: StageScreenRouteProp;
};

export type EditStepInfoScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EditStepInfo'>;
export type EditStepInfoScreenRouteProp = RouteProp<RootStackParamList, 'EditStepInfo'>;
export type EditStepInfoScreenProps = {
  navigation: EditStepInfoScreenNavigationProp;
  route: EditStepInfoScreenRouteProp;
};

export type EditStageInfoScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EditStageInfo'>;
export type EditStageInfoScreenRouteProp = RouteProp<RootStackParamList, 'EditStageInfo'>;
export type EditStageInfoScreenProps = {
  navigation: EditStageInfoScreenNavigationProp;
  route: EditStageInfoScreenRouteProp;
};

export type EditAccommodationScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EditAccommodation'>;
export type EditAccommodationScreenRouteProp = RouteProp<RootStackParamList, 'EditAccommodation'>;
export type EditAccommodationScreenProps = {
  navigation: EditAccommodationScreenNavigationProp;
  route: EditAccommodationScreenRouteProp;
};

export type EditActivityScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EditActivity'>;
export type EditActivityScreenRouteProp = RouteProp<RootStackParamList, 'EditActivity'>;
export type EditActivityScreenProps = {
  navigation: EditActivityScreenNavigationProp;
  route: EditActivityScreenRouteProp;
};




