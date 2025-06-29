import * as ImageManipulator from 'expo-image-manipulator';
import { Alert } from 'react-native';

export interface CompressedImageResult {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

export class ImageCompressionUtil {
  private maxFileSize: number = 4 * 1024 * 1024; // 4MB (marge de sécurité)
  private maxWidth: number = 1920;
  private maxHeight: number = 1080;
  private quality: number = 0.85;
  private setCompressionState?: (isCompressing: boolean, progress?: number) => void;

  constructor(setCompressionState?: (isCompressing: boolean, progress?: number) => void) {
    this.setCompressionState = setCompressionState;
  }

  /**
   * Compresse une image si elle dépasse la limite de taille
   */
  async compressImage(file: any): Promise<any> {
    try {
      // Si ce n'est pas une image, retourner tel quel
      if (!file.mimeType || !file.mimeType.startsWith('image/')) {
        return file;
      }

      // Obtenir la taille du fichier
      const fileSize = await this.getFileSize(file.uri);
      
      // Si l'image est déjà assez petite, pas besoin de compression
      if (fileSize && fileSize <= this.maxFileSize) {
        return file;
      }

      console.log(`Compression nécessaire pour ${file.name}: ${Math.round(fileSize / 1024)}KB -> cible 4MB`);

      // Compression progressive
      let currentQuality = this.quality;
      let currentWidth = this.maxWidth;
      let currentHeight = this.maxHeight;
      let attempts = 0;
      const maxAttempts = 5;

      while (attempts < maxAttempts) {
        try {
          const result = await ImageManipulator.manipulateAsync(
            file.uri,
            [
              {
                resize: {
                  width: currentWidth,
                  height: currentHeight,
                },
              },
            ],
            {
              compress: currentQuality,
              format: ImageManipulator.SaveFormat.JPEG,
            }
          );

          // Vérifier la taille du fichier compressé
          const compressedSize = await this.getFileSize(result.uri);
          
          if (!compressedSize || compressedSize <= this.maxFileSize) {
            // Succès, retourner l'image compressée
            console.log(`Compression réussie: ${Math.round((compressedSize || 0) / 1024)}KB`);
            return {
              ...file,
              uri: result.uri,
              mimeType: 'image/jpeg',
              name: file.name?.replace(/\.(png|webp|heic)$/i, '.jpg') || `compressed_${Date.now()}.jpg`,
            };
          }

          // Réduire la qualité et les dimensions pour le prochain essai
          currentQuality = Math.max(0.3, currentQuality - 0.15);
          currentWidth = Math.round(currentWidth * 0.8);
          currentHeight = Math.round(currentHeight * 0.8);
          attempts++;
          
          console.log(`Tentative ${attempts}: qualité ${currentQuality}, dimensions ${currentWidth}x${currentHeight}`);
        } catch (error) {
          console.error('Erreur lors de la compression:', error);
          break;
        }
      }

      // Si on arrive ici, la compression a échoué
      console.warn('Impossible de compresser l\'image sous 4MB, utilisation de l\'original');
      Alert.alert(
        'Attention', 
        `L'image "${file.name}" est très volumineuse et pourrait ne pas s'uploader correctement.`,
        [{ text: 'OK' }]
      );
      return file;
    } catch (error) {
      console.error('Erreur dans compressImage:', error);
      return file;
    }
  }

  /**
   * Compresse plusieurs images avec indicateur de progression
   */
  async compressImages(files: any[]): Promise<any[]> {
    if (files.length === 0) return files;
    
    // Démarrer l'indicateur de progression
    this.showCompressionProgress();
    
    const results: any[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        // Mettre à jour la progression
        const progress = i / files.length;
        this.setCompressionState?.(true, progress);
        
        const compressedFile = await this.compressImage(file);
        results.push(compressedFile);
      } catch (error) {
        console.error('Erreur lors de la compression de', file.name, ':', error);
        results.push(file); // Garder l'original en cas d'erreur
      }
    }
    
    // Finaliser la progression
    this.setCompressionState?.(true, 1);
    
    // Petit délai pour montrer que c'est terminé
    setTimeout(() => {
      this.hideCompressionProgress();
    }, 500);
    
    return results;
  }

  /**
   * Obtient la taille d'un fichier
   */
  private async getFileSize(uri: string): Promise<number | null> {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      return blob.size;
    } catch (error) {
      console.error('Erreur lors de l\'obtention de la taille du fichier:', error);
      return null;
    }
  }

  /**
   * Affiche un indicateur de progression
   */
  showCompressionProgress(): void {
    this.setCompressionState?.(true, 0);
  }

  /**
   * Cache l'indicateur de progression
   */
  hideCompressionProgress(): void {
    this.setCompressionState?.(false, 0);
  }

  /**
   * Affiche une erreur
   */
  showError(message: string): void {
    Alert.alert('Erreur', message);
  }
}

// Hook pour utiliser la compression dans les composants React
export const useImageCompression = (setCompressionState?: (isCompressing: boolean, progress?: number) => void) => {
  return new ImageCompressionUtil(setCompressionState);
};
