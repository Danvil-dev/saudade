import { createClient } from "@supabase/supabase-js";
import { number, success } from "astro:schema";

const supabaseURL = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseURL, supabaseKey);

export const getProducts = async () => {
  const { data, error } = await supabase.from("products").select("*");
  console.log(data);

  if (error) {
    console.error("Fallo al conseguir todos los productos:", error.message);
    return [];
  }

  return data;
};

// Nos devuelve una lista con todos los productos de una misma categoria
export const getRelated = async (category: string) => {
  const { data, error } = await supabase.from("products").select("*").eq("category", category);

  if (error) {
    console.error("[getRelated] Error al conseguir los productos relacionados:", error.message);
    return [];
  }
  console.log(data);
  return data || [];
};

export const getCategories = async () => {
  const { data, error } = await supabase.from("products").select("category");

  if (error) {
    console.error("[getCategories] Error al conseguir las categorias.", error.message);
    return [];
  }

  const categorias = [...new Set(data.map((item) => item.category))].filter(Boolean);
  return categorias;
};

export const getProductsOfCategory = async (category: string) => {
  const { data, error } = await supabase.from("products").select("*").eq("category", category);

  if (error) {
    console.error(
      "[getProductsOfCategory] Error al conseguir los productos de una categoria",
      error.message,
    );
    return [];
  }

  return data;
};

export interface Product {
  name: string;
  description: string;
  category: string;
  image?: string | null;
  price: number;
}

export const createProduct = async (supabaseClient: any, product: Product, imageFile?: File) => {
  let imageURL: string | null = null;

  //  Subimos la imagen
  if (imageFile) {
    const fileExtension = imageFile.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
    const filePath = `items/${fileName}`;

    const { error: storageError } = await supabaseClient.storage
      .from("products-images")
      .upload(filePath, imageFile);

    if (storageError) {
      console.error("Error al subir la imagen:", storageError.message);
      return { success: false, error: `Error en imagen: ${storageError.message}` };
    }

    // Conseguimos la URL pública
    const { data: urlData } = supabaseClient.storage.from("products-images").getPublicUrl(filePath);

    imageURL = urlData.publicUrl;
  }

  // Añadimos el producto en la bbdd
  const { data, error } = await supabaseClient
    .from("products")
    .insert([
      {
        name: product.name,
        description: product.description,
        category: product.category,
        price: product.price,
        image: imageURL,
      },
    ])
    .select();

  if (error) {
    console.error("Error al crear el producto:", error.message);
    return { success: false, error: error.message };
  }

  return { success: true, data };
};

export const editProduct = async (
  supabaseClient: any,
  productId: number,
  fields: Partial<Product>,
  imageFile?: File,
) => {
  let imageURL: string | null = null;

  // Subir nueva imagen si la hay
  if (imageFile) {
    const fileExtension = imageFile.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
    const filePath = `items/${fileName}`;

    const { error: storageError } = await supabaseClient.storage
      .from("products-images")
      .upload(filePath, imageFile);

    if (storageError) {
      console.error("Error al subir la imagen:", storageError.message);
      return { success: false, error: `Error en imagen: ${storageError.message}` };
    }

    const { data: urlData } = supabaseClient.storage.from("products-images").getPublicUrl(filePath);

    imageURL = urlData.publicUrl;
  }

  // Preparar campos a actualizar
  const updateData: Partial<Product> = { ...fields };
  if (imageURL) {
    updateData.image = imageURL;
  }

  // Actualizar en Supabase
  const { data, error } = await supabaseClient
    .from("products")
    .update(updateData)
    .eq("id", productId)
    .select();

  if (error) {
    console.error("Error al actualizar el producto: ", error.message);
    return { success: false, error: error.message };
  }

  return { success: true, data };
};

export const deleteProduct = async (supabaseClient: any, productId: number) => {
  const { data, error } = await supabaseClient
    .from("products")
    .delete()
    .eq("id", productId)
    .select();

  if (error) {
    console.error("Error al eliminar el producto: ", error.message);
    return { success: false, error: error.message };
  }

  return { success: true, data };
};

// Crear reserva
export interface Booking {
  total_price: number;
  paid: boolean;
  name: string;
  email: string;
  number: number;
}
export interface ItemsBooking {
  product_id: number;
  quantity: number;
  price: number;
}

export const createBooking = async (
  supabaseClient: any,
  booking: Booking,
  cartItems: ItemsBooking[],
) => {
  try {
    const { data, error } = await supabaseClient
      .from("bookings")
      .insert([
        {
          total_price: booking.total_price,
          paid: booking.paid,
          name: booking.name,
          email: booking.email,
          number: booking.number,
        },
      ])
      .select()
      .single();

    if (error || !data) {
      console.error("Error al crear la reserva:", error?.message);
      return { success: false, error: error?.message };
    }

    const itemsToInsert = cartItems.map((item) => ({
      booking_id: data.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: itemsError } = await supabaseClient
      .from("productsBooking")
      .insert(itemsToInsert);

    if (itemsError) {
      console.error("Error al guardar los items de la reserva:", itemsError.message);
      return { success: false, error: itemsError.message };
    }

    return { success: true, bookingId: data.id };
  } catch (e: any) {
    console.error("Error en [createBooking]:", e);
    return { success: false, error: e?.message || "Error inesperado" };
  }
};

export const editBooking = async (supabaseClient: any, bookingId: number, paid: boolean) => {
  try {
    const { data, error } = await supabaseClient
      .from("bookings")
      .update({ paid })
      .eq("id", bookingId)
      .select()
      .single();

    if (error) {
      console.error("Error al actualizar la reserva", error.message);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (e: any) {
    console.error("Error en [updateBookingPaymentStatus]:", e);
    return { success: false, error: e?.message || "Error" };
  }
};

export const getBookings = async (supabaseClient: any) => {
  const { data, error } = await supabaseClient.from("bookings").select("*");

  if (error) {
    console.error("[getBookings] Error al conseguir las reservas pagadas");
    return [];
  }

  return { success: true, data };
};

export const deleteBooking = async (supabaseClient: any, bookingId: number) => {
  const { data, error } = await supabaseClient.from("bookings").delete().eq("id", bookingId);

  if (error) {
    console.error("Error al eliminar la reserva: ", error.message);
    return { success: false, error: error.message };
  }

  return { success: true, data };
};

export const autoDeletePaidBokings = async (supabaseClient: any, daysOld: number = 30) => {
  try {
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - daysOld);

    const { data, error } = await supabaseClient
      .from("bookings")
      .delete()
      .eq("paid", true)
      .lt("created_at", limitDate.toISOString());

    if (error) {
      console.error("Error al eliminar reservas pagadas antiguas:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true, deletedCount: data?.length || 0, data };
  } catch (e: any) {
    console.error("Error en [autoDeletePaidBookings]:", e);
    return { success: false, error: e?.message || "Error inesperado" };
  }
};

export const getItemsOfBooking = async (supabaseClient: any, bookingId: number) => {
  const { data, error } = await supabaseClient
    .from("productsBooking")
    .select("*, products(*)")
    .eq("booking_id", bookingId)
    .select();

  if (error) {
    console.error("[getItemsOfBooking] Error al conseguir los productos: ", error.message);
    return [];
  }

  return data || [];
};

export function productForJson(product: any) {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    category: product.category,
    image: product.image,
    price: product.price,
  };
}