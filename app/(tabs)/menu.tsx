import { RouteProp, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { RootStackParamList } from './_layout';

type MenuScreenRouteProp = RouteProp<RootStackParamList, 'menu'>;

const PEXELS_API_KEY = 'wqnLLVpqpvtSLl2lUxzy7EjMvOjP0SN2qfdr5ysoNyfWTr2ImV0u743Q';

async function fetchImageUrl(query: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`,
      {
        headers: {
          Authorization: PEXELS_API_KEY,
        },
      }
    );
    if (!response.ok) return null;
    const data = await response.json();
    return data.photos?.[0]?.src?.medium ?? null;
  } catch (err) {
    console.error(`Image fetch failed for "${query}"`, err);
    return null;
  }
}

export default function TabTwoScreen() {
  const route = useRoute<MenuScreenRouteProp>();
  const { responseText } = route.params as { responseText: string };
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Strip ```json wrappers if present
        const cleaned = responseText
          .trim()
          .replace(/^```(json)?/i, '')
          .replace(/```$/, '')
          .trim();

        const parsed = JSON.parse(cleaned);

        const enrichedItems = await Promise.all(
          parsed.map(async (item: any) => {
            const imageUrl = await fetchImageUrl(item.title);
            return { ...item, imageUrl };
          })
        );

        setMenuItems(enrichedItems);
      } catch (err) {
        console.error('Error loading menu items:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [responseText]);

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Menu</Text>
        <View style={styles.separator} />
        {loading ? (
          <ActivityIndicator size="large" color="#888" />
        ) : (
          menuItems.map((item, index) => (
            <View key={index} style={styles.card}>
              {item.imageUrl && (
                <Image source={{ uri: item.imageUrl }} style={styles.image} />
              )}
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemDescription}>
                {item.description ?? 'No description'}
              </Text>
              <Text style={styles.itemPrice}>${item.price}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
  },
  container: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  separator: {
    height: 1,
    width: '100%',
    backgroundColor: '#ccc',
    marginBottom: 20,
  },
  card: {
    width: '100%',
    marginBottom: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: '#fafafa',
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    marginBottom: 12,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 6,
  },
  itemPrice: {
    fontSize: 16,
    color: '#000',
  },
});
