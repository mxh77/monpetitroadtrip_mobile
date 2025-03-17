import config from '../config';
import React, { useState } from 'react';
import { StyleSheet, View, TextInput, Text, TouchableOpacity, Alert, ActivityIndicator, Modal } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types';
import Constants from 'expo-constants';
import { set } from 'date-fns';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;
type LoginScreenRouteProp = RouteProp<RootStackParamList, 'Login'>;

type Props = {
  navigation: LoginScreenNavigationProp;
  route: LoginScreenRouteProp;
};

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('maxime.heron@gmail.com');
  const [password, setPassword] = useState('1234');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    console.log('Attempting to log in with email:', email);
    console.log('Attempting to log in with password:', password);
    console.log('Attempting to log in with url:', config.BACKEND_URL);
    try {
      const response = await fetch(`${config.BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      //Afficher le token
      console.log('Token:', data.token);


      if (response.ok) {
        // Connexion réussie
        console.log('Login successful');
        // Rediriger vers la page des roadtrips
        navigation.navigate('RoadTrips', { refresh: undefined });
      } else {
        // Connexion échouée
        console.log('Login failed:', data.message);
        setErrorMessage(data.message || 'Une erreur est survenue.');
      }
    } catch (error) {
      console.error('Error during login:', error);
      setErrorMessage('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsLoading(false
      );
    }
  };

  return (
    <View style={styles.container}>
      <Modal
        animationType="fade"
        transparent={true}
        visible={isLoading}
        onRequestClose={() => {
          setIsLoading(false);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" color="#007BFF" />
          </View>
        </View>
      </Modal>

      <Text style={styles.title}>Connexion</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Se connecter</Text>
      </TouchableOpacity>
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    marginBottom: 24,
  },
  input: {
    width: '80%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 16,
  },
  button: {
    width: '80%',
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    marginTop: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
  },
});