import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { getRecetaRating, postRecetaRating } from '../services/api';

const Star = ({ filled, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.starButton}>
    <Text style={[styles.star, filled ? styles.filled : styles.empty]}>{filled ? '★' : '☆'}</Text>
  </TouchableOpacity>
);

export default function StarRating({ recetaId, style, onRated }) {
  const [average, setAverage] = useState(null);
  const [count, setCount] = useState(0);
  const [userRating, setUserRating] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getRecetaRating(recetaId);
      setAverage(data.average);
      setCount(data.count);
      setUserRating(data.user_rating);
    } catch (err) {
      console.warn('Error loading rating', err.message || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [recetaId]);

  const handlePress = async (value) => {
    setSubmitting(true);
    try {
      const res = await postRecetaRating(recetaId, value);
      setAverage(res.average);
      setCount(res.count);
      setUserRating(res.user_rating);
      if (onRated) onRated(res);
    } catch (err) {
      console.warn('Error posting rating', err.message || err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, style]}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            filled={userRating ? n <= userRating : average ? n <= Math.round(average) : false}
            onPress={() => handlePress(n)}
          />
        ))}
        {submitting ? <ActivityIndicator style={{ marginLeft: 8 }} /> : null}
      </View>
      <Text style={styles.averageText}>{average !== null ? `${average}/5 (${count})` : `Sin calificaciones`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starButton: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  star: {
    fontSize: 22,
  },
  filled: {
    color: '#FFD700',
  },
  empty: {
    color: '#999',
  },
  averageText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
});
