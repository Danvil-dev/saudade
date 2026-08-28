import { createClient } from "@supabase/supabase-js";

// Conseguimos la url y la key de nuestra supabase
const supabaseURL = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseURL, supabaseKey);

/**
 * @function getProducts
 * @description Obtiene todos los productos de la base de datos
 * @returns Lista de productos
 */
export const getProducts = async () => {
  const { data, error } = await supabase.from("products").select("*");
  console.log(data);

  if (error) {
    console.error("Fallo al conseguir todos los productos:", error.message);
    return [];
  }

  return data;
};

/**
 * @function getRelated
 * @description Obtiene todos los productos relacionados (misma categoria)
 * @params category Categoria del producto
 * @returns Lista de productos relacionados
 */
export const getRelated = async (category: string) => {
  const { data, error } = await supabase.from("products").select("*").eq("category", category);

  if (error) {
    console.error("[getRelated] Error al conseguir los productos relacionados:", error.message);
    return [];
  }
  console.log(data);
  return data || [];
};

/**
 * @function getCategories
 * @description Obtiene todas las categorias existentes de los productos
 * @returns Lista de todas las categorias
 */
export const getCategories = async () => {
  const { data, error } = await supabase.from("products").select("category");

  if (error) {
    console.error("[getCategories] Error al conseguir las categorias.", error.message);
    return [];
  }

  const categorias = [...new Set(data.map((item) => item.category))].filter(Boolean);
  return categorias;
};

/**
 * @function getProductsOfCategory
 * @description Obtiene todos los productos de una categoría específica
 * @param category Categoria de la que queremos conseguir los productos
 * @returns Lista de productos de la categoría especificada
 */
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

// Interfaz que define la estructura que debe tener "Product"
export interface Product {
  name: string;
  description: string;
  category: string;
  image?: string | null;
  price: number;
}

/**
 * @function createProduct
 * @description Crea un producto:
 * @param: supabaseClient: any = cliente de supabase autorizado
 * @param product = Producto que queremos crear/añadir a la bd
 * @param imageFile = Imagen del producto
 *
 * @returns {success, data}: Devuelve el codigo de éxito y el producto creado
 */
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

/**
 * @function editProduct
 * @description Edita la informacion de un producto existente
 * @param supabaseClient = cliente de supabase autorizado
 * @param productId = producto que queremoms modificar
 * @param fields = campos que vamos a modificar
 * @param imageFile = imagen nueva (si se ha agregad0)
 * @returns {success, data} = Código de éxito y el producto modificado
 */
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
/**
 * @function deleteProduct
 * @description Elimina el producto especificado
 * @param supabaseClient : cliente de supabase autorizado
 * @param productId : id del producto que queremos elimianr
 * @returns {success, data} Código de éxito y datos del producto recien eliminados
 */
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

// Interfaz que declara la estructura de una reserva
export interface Booking {
  total_price: number;
  paid: boolean;
  name: string;
  email: string;
  number: number;
}

// Interfaz que declara la estructura para los productos de una reserva
export interface ItemsBooking {
  product_id: number;
  quantity: number;
  price: number;
}

/**
 * @function createBooking
 * @description Crea una reserva
 * @param supabaseClient Cliente de supabase autorizado
 * @param booking Reserva que queremos añadir
 * @param cartItems Lista de productos que añadimos en la reserva
 * @returns {success, data} Código de exito y datos de la reserva creada
 */
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

/**
 * @function editBooking
 * @description Edita la reserva especificada
 * @param supabaseClient Cliente de supabase autorizado
 * @param bookingId Id de la reserva que queremos editar
 * @param paid Estado de la reservada (pagada o no pagada)
 * @returns {success, data} Código de éxito y datos de la reserva editada
 */
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

/**
 * @function getBooking
 * @description Devuelve una lista con todas las reservas
 * @param supabaseClient Cliente de supabase autorizado
 * @returns {success, data} Código de éxito y datos de las reservas
 */
export const getBookings = async (supabaseClient: any) => {
  const { data, error } = await supabaseClient.from("bookings").select("*");

  if (error) {
    console.error("[getBookings] Error al conseguir las reservas pagadas");
    return [];
  }

  return { success: true, data };
};

/**
 * @function deleteBooking
 * @description Eliminar una reserva especificada
 * @param supabaseClient Cliente de supabase autorizado
 * @param bookingId Id de la reserva que queremos eliminar
 * @returns Código de éxito y datos de la reserva eliminada
 */
export const deleteBooking = async (supabaseClient: any, bookingId: number) => {
  const { data, error } = await supabaseClient.from("bookings").delete().eq("id", bookingId);

  if (error) {
    console.error("Error al eliminar la reserva: ", error.message);
    return { success: false, error: error.message };
  }

  return { success: true, data };
};

/**
 * @function autoDeletePaidBokings
 * @description Elimina automáticamente las reservas hechas hace 30 o más dias que esten pagadas
 * @param supabaseClient Cliente de supabase actualizado
 * @param daysOld Numero de dias limite
 * @returns Código de éxito, número de reservas eliminadas y datos de las mismas
 */
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
/**
 * @function getItemsOfBooking
 * @description Obtiene los productos de la reserva especificada
 * @param supabaseClient Cliente de supabase autorizado
 * @param bookingId Id de la reserva de la que queremos obtener los datos
 * @returns Lista de productos
 */
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

/**
 * @function productForJson
 * @description Transforma los datos de un producto en formato JSON
 * @params product Producto que queremos transformar
 */
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
