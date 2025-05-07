import { RouteProp, useRoute } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RootStackParamList } from './_layout';

type MenuScreenRouteProp = RouteProp<RootStackParamList, 'menu'>;

export default function TabTwoScreen() {
  const route = useRoute<MenuScreenRouteProp>();
  const { responseText } = route.params as { responseText: string };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Menu</Text>
      <View style={styles.separator} />
      {responseText ? (
        <Text>{responseText}</Text>
      ) : (
        <Text>Capture image first</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
