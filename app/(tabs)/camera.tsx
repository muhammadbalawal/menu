import axios from 'axios';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';


import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './_layout';

export default function Camera() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const [responseText, setResponseText] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };


  const pickImageAndSendToGemini = async () => {
    setLoading(true);
    setResponseText('');
  
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        base64: true,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });
  
      if (result.canceled || !result.assets || !result.assets[0].base64) {
        setLoading(false);
        return;
      }
  
      const base64Data = result.assets[0].base64;
  
      const payload = {
        contents: [
          {
            parts: [
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: base64Data,
                },
              },
              {
                text: `Extract structured data from the following restaurant menu.

                      For each menu item, return a JSON object with the following format:
                      {
                        "title": string,
                        "description": string | null,
                        "price": string
                      }

                      If a description is not provided, set its value to null.

                      Return a list of these JSON objects.`,
              },
            ],
          },
        ],
      };
  
      const response = await axios.post(
        'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=AIzaSyCVB-539SxRudfefLjCRGZieVvgaKAk5m4',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
  
      const geminiResponse: any = response.data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
      console.log(geminiResponse)
      setResponseText(geminiResponse);
  
      navigation.navigate('menu', { responseText: geminiResponse });
    } catch (err: any) {
      console.error('Image Picker Gemini error:', err?.response?.data || err.message || err);
      setResponseText('Error: ' + (err?.response?.data?.error?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };
  
  const takePictureAndSendToGemini = async () => {
    if (!cameraRef.current) return;
    setLoading(true);
    setResponseText('');

    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true });

      // Remove the data URI prefix if it exists
      const base64Data = photo.base64.replace(/^data:image\/\w+;base64,/, '');

      const payload = {
        contents: [
          {
            parts: [
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: base64Data,
                },
              },
              {
                text: 'Extract the Title, Description (if no description is provided, return null), and Price from the following restaurant menu. Return the extracted data in a well-structured JSON format.',
              },
            ],
          },
        ],
      };

      // Updated endpoint with gemini-1.5-flash
      const response = await axios.post(
        'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=AIzaSyCVB-539SxRudfefLjCRGZieVvgaKAk5m4',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const geminiResponse: any = response.data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
      setResponseText(geminiResponse);

      // Navigate to the Menu tab and pass the responseText
      navigation.navigate('menu', { responseText: geminiResponse });
    } catch (err: any) {
      console.error('Gemini API error:', err?.response?.data || err.message || err);
      setResponseText('Error: ' + (err?.response?.data?.error?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
            <Text style={styles.text}>Flip</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={takePictureAndSendToGemini}>
            <Text style={styles.text}>Snap + Analyze</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={pickImageAndSendToGemini}>
            <Text style={styles.text}>Pick from Gallery</Text>
          </TouchableOpacity>

        </View>
      </CameraView>

      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#000" />
          <Text>Analyzing image with Gemini...</Text>
        </View>
      )}

      {responseText ? (
        <ScrollView style={styles.resultContainer}>
          <Text style={styles.resultText}>{responseText}</Text>
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'flex-end',
    marginBottom: 60,
  },
  button: {
    backgroundColor: '#00000088',
    padding: 10,
    borderRadius: 10,
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
  },
  loading: {
    alignItems: 'center',
    padding: 16,
  },
  resultContainer: {
    padding: 16,
    backgroundColor: '#f0f0f0',
    maxHeight: 300,
  },
  resultText: {
    color: '#000',
    fontFamily: 'monospace',
  },
});
