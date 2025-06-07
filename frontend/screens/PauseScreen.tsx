import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';

const BASE_URL = 'http://192.168.18.6:8000'; // change if on physical device

export default function PauseScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { session_id } = route.params as { session_id: string };

  const handleResume = () => {
    navigation.goBack(); // returns to CourtScreen
  };

  const handleRestart = async () => {
    try {
      await axios.post(`${BASE_URL}/restart-session/${session_id}`);
      navigation.replace('Court', { session_id }); // restart same session
    } catch (err) {
      console.error('[ERROR] Restart failed:', err);
      Alert.alert('Error', 'Could not restart session.');
    }
  };

  const handleQuit = () => {
    navigation.replace('Home');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Paused</Text>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#4caf50' }]}
        onPress={handleResume}
      >
        <Text style={styles.buttonText}>Resume</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#ffb300' }]}
        onPress={handleRestart}
      >
        <Text style={styles.buttonText}>Restart</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#e53935' }]}
        onPress={handleQuit}
      >
        <Text style={styles.buttonText}>Quit</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 50 },
  button: {
    width: '80%',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  buttonText: { fontSize: 18, color: '#fff', fontWeight: 'bold' },
});
