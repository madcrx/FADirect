import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Image, TouchableOpacity, Alert, Dimensions, Share } from 'react-native';
import { Text, FAB, ActivityIndicator, IconButton, Menu, Checkbox } from 'react-native-paper';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '@types/index';
import { photosApi, Photo } from '@services/api/photos';
import { theme } from '@utils/theme';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';

type PhotoGalleryScreenRouteProp = RouteProp<{ PhotoGallery: { arrangementId: string } }, 'PhotoGallery'>;

const { width } = Dimensions.get('window');
const imageSize = (width - theme.spacing.md * 4) / 3; // 3 columns with spacing

const PhotoGalleryScreen = () => {
  const route = useRoute<PhotoGalleryScreenRouteProp>();
  const arrangementId = route.params?.arrangementId;
  const { user } = useSelector((state: RootState) => state.auth);

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    if (arrangementId) {
      loadPhotos();
      requestPermissions();
    } else {
      setLoading(false);
    }
  }, [arrangementId]);

  const requestPermissions = async () => {
    await ImagePicker.requestMediaLibraryPermissionsAsync();
    await MediaLibrary.requestPermissionsAsync();
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

  const handleUploadMultiple = async () => {
    if (!arrangementId) {
      Alert.alert('Error', 'No arrangement selected');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 10,
        quality: 0.8,
      });

      if (result.canceled) {
        return;
      }

      setUploading(true);

      // Upload each photo
      for (const asset of result.assets) {
        await photosApi.uploadPhoto(
          asset.uri,
          asset.fileName || 'photo.jpg',
          asset.mimeType || 'image/jpeg',
          arrangementId
        );
      }

      Alert.alert('Success', `${result.assets.length} photo(s) uploaded successfully`);
      await loadPhotos();
    } catch (error: any) {
      console.error('Error uploading photos:', error);
      Alert.alert('Upload Failed', error.message || 'Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  const toggleSelection = (photoId: string) => {
    const newSelection = new Set(selectedPhotos);
    if (newSelection.has(photoId)) {
      newSelection.delete(photoId);
    } else {
      newSelection.add(photoId);
    }
    setSelectedPhotos(newSelection);

    // Exit selection mode if no photos selected
    if (newSelection.size === 0) {
      setSelectionMode(false);
    }
  };

  const handlePhotoPress = (photo: Photo) => {
    if (selectionMode) {
      toggleSelection(photo.id);
    } else {
      // Long press to enter selection mode
      setSelectionMode(true);
      setSelectedPhotos(new Set([photo.id]));
    }
  };

  const handlePhotoLongPress = (photo: Photo) => {
    setSelectionMode(true);
    setSelectedPhotos(new Set([photo.id]));
  };

  const handleSaveSelected = async () => {
    try {
      const photosToSave = photos.filter(p => selectedPhotos.has(p.id));

      for (const photo of photosToSave) {
        // Download and save to device
        const fileUri = FileSystem.documentDirectory + photo.fileName;
        await FileSystem.downloadAsync(photo.fileUrl, fileUri);
        await MediaLibrary.saveToLibraryAsync(fileUri);
      }

      Alert.alert('Success', `${photosToSave.length} photo(s) saved to gallery`);
      setSelectionMode(false);
      setSelectedPhotos(new Set());
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save photos');
    }
  };

  const handleShareSelected = async () => {
    try {
      const photosToShare = photos.filter(p => selectedPhotos.has(p.id));
      const urls = photosToShare.map(p => p.fileUrl);

      await Share.share({
        message: `Sharing ${urls.length} photo(s) from FA Direct`,
        url: urls[0], // Share first photo URL
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to share photos');
    }
  };

  const handleDeleteSelected = async () => {
    Alert.alert(
      'Delete Photos',
      `Are you sure you want to delete ${selectedPhotos.size} photo(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              for (const photoId of selectedPhotos) {
                await photosApi.deletePhoto(photoId);
              }
              Alert.alert('Success', 'Photos deleted');
              setSelectionMode(false);
              setSelectedPhotos(new Set());
              await loadPhotos();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete photos');
            }
          },
        },
      ]
    );
  };

  const renderPhoto = ({ item }: { item: Photo }) => {
    const isSelected = selectedPhotos.has(item.id);

    return (
      <TouchableOpacity
        onPress={() => handlePhotoPress(item)}
        onLongPress={() => handlePhotoLongPress(item)}
        style={[
          styles.photoContainer,
          isSelected && styles.photoSelected,
        ]}>
        <Image
          source={{ uri: item.fileUrl }}
          style={styles.photo}
          resizeMode="cover"
        />
        {selectionMode && (
          <View style={styles.selectionOverlay}>
            <Checkbox
              status={isSelected ? 'checked' : 'unchecked'}
              onPress={() => toggleSelection(item.id)}
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

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
      {selectionMode && (
        <View style={styles.selectionBar}>
          <Text variant="titleMedium">{selectedPhotos.size} selected</Text>
          <View style={styles.selectionActions}>
            <IconButton icon="content-save" onPress={handleSaveSelected} />
            <IconButton icon="share-variant" onPress={handleShareSelected} />
            {user?.role === 'arranger' && (
              <IconButton icon="delete" onPress={handleDeleteSelected} />
            )}
            <IconButton
              icon="close"
              onPress={() => {
                setSelectionMode(false);
                setSelectedPhotos(new Set());
              }}
            />
          </View>
        </View>
      )}

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
        label={uploading ? 'Uploading...' : 'Add Photos'}
        onPress={handleUploadMultiple}
        disabled={uploading}
        visible={!selectionMode}
        extended={true}
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
  selectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primaryContainer,
  },
  selectionActions: {
    flexDirection: 'row',
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
  photoSelected: {
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  selectionOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
  },
  fab: {
    position: 'absolute',
    right: theme.spacing.md,
    bottom: theme.spacing.md,
    backgroundColor: theme.colors.primary,
  },
});

export default PhotoGalleryScreen;
