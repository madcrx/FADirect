import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Image, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { Text, FAB, ActivityIndicator } from 'react-native-paper';
import { useRoute, RouteProp } from '@react-navigation/native';
import { photosApi, Photo } from '@services/api/photos';
import { theme } from '@utils/theme';
import * as ImagePicker from 'expo-image-picker';

type PhotoGalleryScreenRouteProp = RouteProp<{ PhotoGallery: { arrangementId: string } }, 'PhotoGallery'>;

const { width } = Dimensions.get('window');
const imageSize = (width - theme.spacing.md * 4) / 3; // 3 columns with spacing

const PhotoGalleryScreen = () => {
  const route = useRoute<PhotoGalleryScreenRouteProp>();
  const arrangementId = route.params?.arrangementId;

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (arrangementId) {
      loadPhotos();
      requestPermissions();
    } else {
      setLoading(false);
    }
  }, [arrangementId]);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library to upload photos.');
    }
  };

  const loadPhotos = async () => {
    if (!arrangementId) return;

    try {
      setLoading(true);
      const response = await photosApi.getPhotos(arrangementId);
      setPhotos(response.photos);
    } catch (error: any) {
      console.error('Error loading photos:', error);
      Alert.alert('Error', error.message || 'Failed to load photos');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!arrangementId) {
      Alert.alert('Error', 'No arrangement selected');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];
      setUploading(true);

      await photosApi.uploadPhoto(
        asset.uri,
        asset.fileName || 'photo.jpg',
        asset.mimeType || 'image/jpeg',
        arrangementId
      );

      Alert.alert('Success', 'Photo uploaded successfully');
      await loadPhotos();
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      Alert.alert('Upload Failed', error.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoPress = (photo: Photo) => {
    Alert.alert(
      'Photo Options',
      photo.caption || 'No caption',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDelete(photo.id),
        },
      ]
    );
  };

  const handleDelete = async (photoId: string) => {
    try {
      await photosApi.deletePhoto(photoId);
      Alert.alert('Success', 'Photo deleted');
      await loadPhotos();
    } catch (error: any) {
      console.error('Error deleting photo:', error);
      Alert.alert('Error', error.message || 'Failed to delete photo');
    }
  };

  const renderPhoto = ({ item }: { item: Photo }) => (
    <TouchableOpacity onPress={() => handlePhotoPress(item)} style={styles.photoContainer}>
      <Image
        source={{ uri: item.fileUrl }}
        style={styles.photo}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  if (!arrangementId) {
    return (
      <View style={styles.emptyContainer}>
        <Text variant="bodyLarge">Please select an arrangement first</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {photos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text variant="bodyLarge" style={styles.emptyText}>
            No photos uploaded yet
          </Text>
          <Text variant="bodyMedium" style={styles.emptySubtext}>
            Tap the camera button to add photos
          </Text>
        </View>
      ) : (
        <FlatList
          data={photos}
          renderItem={renderPhoto}
          keyExtractor={item => item.id}
          numColumns={3}
          contentContainerStyle={styles.grid}
        />
      )}

      <FAB
        icon={uploading ? 'loading' : 'camera'}
        style={styles.fab}
        label={uploading ? 'Uploading...' : 'Add Photo'}
        onPress={handleUpload}
        disabled={uploading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  emptySubtext: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
  },
  grid: {
    padding: theme.spacing.sm,
  },
  photoContainer: {
    width: imageSize,
    height: imageSize,
    margin: theme.spacing.xs,
    borderRadius: theme.roundness,
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceVariant,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  fab: {
    position: 'absolute',
    right: theme.spacing.md,
    bottom: theme.spacing.md,
    backgroundColor: theme.colors.primary,
  },
});

export default PhotoGalleryScreen;
