export const uploadToCloudinary = async (imageUri: string): Promise<string | null> => {
  const formData = new FormData();
  formData.append("file", {
    uri: imageUri,
    type: "image/jpeg",
    name: "upload.jpg",
  } as any);
  formData.append("upload_preset", "ml_default"); // ganti dengan preset kamu

  try {
    const response = await fetch("https://api.cloudinary.com/v1_1/ml_default/image/upload", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    return data.secure_url; // URL gambar yang bisa kamu simpan di Firestore
  } catch (error) {
    console.error("Upload gagal:", error);
    return null;
  }
};
