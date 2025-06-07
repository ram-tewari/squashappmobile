import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { Slider } from '@miblanchard/react-native-slider';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';

const BASE_URL = 'http://192.168.18.6:8000'; // change if on physical device

export default function HomeScreen() {
  const navigation = useNavigation<any>();

  const [shots, setShots] = useState(5);
  const [timeBetweenShots, setTimeBetweenShots] = useState(2);
  const [sets, setSets] = useState(3);
  const [timeBetweenSets, setTimeBetweenSets] = useState(5);

  const handleStart = async () => {
  try {
    console.log('Sending session settings to backend...');
    const res = await axios.post(`${BASE_URL}/start-session`, {
      num_shots: shots,
      time_between_shots: timeBetweenShots,
      num_sets: sets,
      time_between_sets: timeBetweenSets,
    });

    const session_id = res.data.session_id;
    console.log('Received session_id:', session_id);

    navigation.navigate('Court', { session_id });
  } catch (err: any) {
    console.error('[ERROR] Failed to start session:', err);
    Alert.alert('Connection Error', 'Could not start session.\nCheck your IP address or server.');
  }
};


  return (
    <View style={styles.container}>
      <Text style={styles.header}>Squash Trainer Setup</Text>

      {[
        { label: 'Number of Shots per Rally:', value: shots, setter: setShots, max: 20 },
        { label: 'Time Between Shots (s):', value: timeBetweenShots, setter: setTimeBetweenShots, max: 10 },
        { label: 'Number of Sets:', value: sets, setter: setSets, max: 10 },
        { label: 'Time Between Sets (s):', value: timeBetweenSets, setter: setTimeBetweenSets, max: 30 },
      ].map((item, index) => (
        <View key={index} style={styles.sliderBlock}>
          <View style={styles.sliderHeader}>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.value}>{item.value}</Text>
          </View>
          <Slider
            value={item.value}
            onValueChange={val => item.setter(Math.round(val[0]))}
            minimumValue={1}
            maximumValue={item.max}
            step={1}
            thumbTintColor="#2563eb"
            minimumTrackTintColor="#2563eb"
            maximumTrackTintColor="#e5e7eb"
          />
        </View>
      ))}

      <Pressable style={styles.okButton} onPress={handleStart}>
        <Text style={styles.okText}>OK</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  header: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 30 },
  sliderBlock: { marginBottom: 30 },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { fontSize: 16 },
  value: { fontSize: 16, fontWeight: 'bold' },
  okButton: {
    marginTop: 40,
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  okText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
