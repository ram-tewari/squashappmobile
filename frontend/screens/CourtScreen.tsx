import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';

const { width } = Dimensions.get('window');
const boxSize = width * 0.45;
const BASE_URL = 'http://192.168.1.5:8000'; // Replace with your machine's local IP address

export default function CourtScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { session_id } = route.params;

  const [targetZone, setTargetZone] = useState<number | null>(null);
  const [rallyInProgress, setRallyInProgress] = useState(false);
  const [score, setScore] = useState({ player: 0, opponent: 0 });
  const [setNumber, setSetNumber] = useState(1);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    startNextShot();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const startNextShot = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/next-shot/${session_id}`);
      const data = res.data;

      if (data.status === 'completed') {
        Alert.alert('Session Complete', 'Great job!');
        navigation.replace('Home');
        return;
      }

      if (data.status === 'wait_for_tap') return;

      if (data.status === 'set_complete') {
        setSetNumber(data.set_number + 1);
        setTargetZone(null);
        setRallyInProgress(false);
        Alert.alert('Set Complete', data.message);
        setTimeout(() => {
          startNextShot();
        }, 1000);
        return;
      }

      if (data.status === 'ok') {
        setTargetZone(data.target_zone);
        setSetNumber(data.set_number);
        setRallyInProgress(true);

        timeoutRef.current = setTimeout(() => {
          handleTimeout();
        }, 3000);
      }
    } catch (err) {
      console.error('[ERROR] Failed to fetch next shot:', err);
      Alert.alert('Connection Error', 'Could not get next shot.');
    }
  };

  const handleTap = async (zone: number) => {
    if (!rallyInProgress || zone !== targetZone) return;

    try {
      const res = await axios.post(`${BASE_URL}/tap-shot`, {
        session_id,
        clicked_zone: zone,
      });

      const { status } = res.data;

      setTargetZone(null);
      setRallyInProgress(false);
      clearTimeout(timeoutRef.current!);

      if (status === 'correct' || status === 'point_won') {
        if (status === 'point_won') {
          setScore(s => ({ ...s, player: s.player + 1 }));
        }
        startNextShot();
      } else if (status === 'set_won') {
        Alert.alert('Set Won!', 'You won the set!');
        setScore({ player: 0, opponent: 0 });
        startNextShot();
      } else if (status === 'mistake') {
        setScore(s => ({ ...s, opponent: s.opponent + 1 }));
        startNextShot();
      } else if (status === 'set_lost') {
        Alert.alert('Set Lost', 'Opponent won the set.');
        setScore({ player: 0, opponent: 0 });
        startNextShot();
      }
    } catch (err) {
      console.error('[ERROR] Tap handling failed:', err);
    }
  };

  const handleTimeout = async () => {
    setTargetZone(null);
    setRallyInProgress(false);
    try {
      const res = await axios.post(`${BASE_URL}/timeout-shot`, {
        session_id,
      });

      const { status } = res.data;

      if (status === 'rally_failed') {
        setScore(s => ({ ...s, opponent: s.opponent + 1 }));
      } else if (status === 'set_lost') {
        Alert.alert('Set Lost', 'You lost the set due to timeout.');
        setScore({ player: 0, opponent: 0 });
      }

      startNextShot();
    } catch (err) {
      console.error('[ERROR] Timeout handling failed:', err);
    }
  };

  const handlePause = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    navigation.navigate('Pause', { session_id });
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handlePause}>
          <Text style={styles.pauseButton}>‖</Text>
        </TouchableOpacity>
        <Text style={styles.scoreText}>
          Set {setNumber} • You {score.player} - {score.opponent} Opponent
        </Text>
      </View>

      <View style={styles.grid}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <TouchableOpacity
            key={i}
            style={[
              styles.zone,
              i === targetZone ? styles.activeZone : styles.inactiveZone,
            ]}
            onPress={() => handleTap(i)}
          >
            <Text style={styles.zoneText}>{i}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50, paddingHorizontal: 16, backgroundColor: '#fff' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  pauseButton: { fontSize: 28, fontWeight: 'bold' },
  scoreText: { fontSize: 16, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  zone: {
    width: boxSize,
    height: boxSize * 0.6,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    marginBottom: 16,
  },
  activeZone: { backgroundColor: '#22c55e' },
  inactiveZone: { backgroundColor: '#d1d5db' },
  zoneText: { fontSize: 30, fontWeight: 'bold' },
});
