import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { Property, BannerAd, BrandSettings, Broker, Client, Lead, Visit, Favorite, Message } from '../types';
import { INITIAL_PROPERTIES, INITIAL_BANNERS, DEFAULT_BRAND_SETTINGS } from '../data';

const PROPERTIES_COLLECTION = 'properties';
const BANNERS_COLLECTION = 'banners';
const SETTINGS_COLLECTION = 'settings';
const BROKERS_COLLECTION = 'corretores';
const CLIENTS_COLLECTION = 'clientes';
const LEADS_COLLECTION = 'leads';
const VISITS_COLLECTION = 'visitas';
const FAVORITES_COLLECTION = 'favoritos';
const MESSAGES_COLLECTION = 'mensagens';

/**
 * Subscribes to real-time updates of Brand/Contact Settings in Firestore
 */
export function subscribeSettings(
  onSuccess: (settings: BrandSettings | null) => void,
  onErr: (err: unknown) => void
) {
  const docRef = doc(db, SETTINGS_COLLECTION, 'brand');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onSuccess(snapshot.data() as BrandSettings);
      } else {
        onSuccess(null);
      }
    },
    (error) => {
      onErr(error);
      handleFirestoreError(error, OperationType.GET, `${SETTINGS_COLLECTION}/brand`);
    }
  );
}

/**
 * Saves/updates BrandSettings in Firestore
 */
export async function saveSettingsToFirestore(settings: BrandSettings): Promise<void> {
  const path = `${SETTINGS_COLLECTION}/${settings.id}`;
  if (!auth.currentUser) {
    throw new Error(`Não autenticado no Firebase Admin. Para sincronizar as alterações de configurações com a nuvem, faça login oficial na conta do Google comercial.vivasc@gmail.com.`);
  }
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, settings.id);
    await setDoc(docRef, settings);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Subscribes to real-time updates of properties in Firestore
 */
export function subscribeProperties(
  onSuccess: (properties: Property[]) => void,
  onErr: (err: unknown) => void
) {
  const collectionRef = collection(db, PROPERTIES_COLLECTION);
  return onSnapshot(
    collectionRef,
    (snapshot) => {
      const propertiesList: Property[] = [];
      snapshot.forEach((docSnap) => {
        propertiesList.push(docSnap.data() as Property);
      });
      onSuccess(propertiesList);
    },
    (error) => {
      onErr(error);
      handleFirestoreError(error, OperationType.GET, PROPERTIES_COLLECTION);
    }
  );
}

/**
 * Subscribes to real-time updates of banners in Firestore
 */
export function subscribeBanners(
  onSuccess: (banners: BannerAd[]) => void,
  onErr: (err: unknown) => void
) {
  const collectionRef = collection(db, BANNERS_COLLECTION);
  return onSnapshot(
    collectionRef,
    (snapshot) => {
      const bannersList: BannerAd[] = [];
      snapshot.forEach((docSnap) => {
        bannersList.push(docSnap.data() as BannerAd);
      });
      onSuccess(bannersList);
    },
    (error) => {
      onErr(error);
      handleFirestoreError(error, OperationType.GET, BANNERS_COLLECTION);
    }
  );
}

/**
 * Creates or overwrites a property in Firestore
 */
export async function savePropertyToFirestore(property: Property): Promise<void> {
  const path = `${PROPERTIES_COLLECTION}/${property.id}`;
  if (!auth.currentUser) {
    throw new Error(`Não conectado oficialmente como Administrador. O seu imóvel "${property.name}" foi salvo apenas LOCALMENTE neste navegador. Para que ele apareça em celulares e seja visto pelos clientes, faça logout e entre usando o botão Google Admin oficial.`);
  }
  try {
    const docRef = doc(db, PROPERTIES_COLLECTION, property.id);
    await setDoc(docRef, property);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Deletes a property from Firestore
 */
export async function deletePropertyFromFirestore(id: string): Promise<void> {
  const path = `${PROPERTIES_COLLECTION}/${id}`;
  if (!auth.currentUser) {
    throw new Error("Não conectado oficialmente como Administrador. A exclusão foi feita apenas LOCALMENTE neste navegador. Para deletar de forma definitiva na nuvem, entre como Google Admin oficial.");
  }
  try {
    const docRef = doc(db, PROPERTIES_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Creates or overwrites a banner in Firestore
 */
export async function saveBannerToFirestore(banner: BannerAd): Promise<void> {
  const path = `${BANNERS_COLLECTION}/${banner.id}`;
  if (!auth.currentUser) {
    throw new Error(`Não autenticado oficialmente. O banner "${banner.title}" foi salvo apenas LOCALMENTE neste navegador. Para salvar de forma global, faça login como Administrador oficial.`);
  }
  try {
    const docRef = doc(db, BANNERS_COLLECTION, banner.id);
    await setDoc(docRef, banner);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Deletes a banner from Firestore
 */
export async function deleteBannerFromFirestore(id: string): Promise<void> {
  const path = `${BANNERS_COLLECTION}/${id}`;
  if (!auth.currentUser) {
    throw new Error("Não conectado oficialmente como Administrador. A exclusão do banner foi feita apenas LOCALMENTE. Para apagar de forma definitiva na nuvem, entre como Google Admin oficial.");
  }
  try {
    const docRef = doc(db, BANNERS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/* ------------------ NEW CRM SERVICE HANDLERS ------------------ */

/**
 * Subscribes to real-time updates of Brokers
 */
export function subscribeBrokers(onSuccess: (brokers: Broker[]) => void, onErr: (err: unknown) => void) {
  const collectionRef = collection(db, BROKERS_COLLECTION);
  return onSnapshot(
    collectionRef,
    (snapshot) => {
      const list: Broker[] = [];
      snapshot.forEach((docSnap) => list.push(docSnap.data() as Broker));
      onSuccess(list);
    },
    (error) => {
      onErr(error);
      handleFirestoreError(error, OperationType.GET, BROKERS_COLLECTION);
    }
  );
}

export async function saveBrokerToFirestore(broker: Broker): Promise<void> {
  const path = `${BROKERS_COLLECTION}/${broker.id}`;
  if (!auth.currentUser) {
    console.warn(`[Firestore Service] Skipping database write for path: ${path} (User is logged in via passcode only). Changes remain local.`);
    return;
  }
  try {
    await setDoc(doc(db, BROKERS_COLLECTION, broker.id), broker);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteBrokerFromFirestore(id: string): Promise<void> {
  const path = `${BROKERS_COLLECTION}/${id}`;
  if (!auth.currentUser) {
    console.warn(`[Firestore Service] Skipping database delete for path: ${path} (User is logged in via passcode only). Changes remain local.`);
    return;
  }
  try {
    await deleteDoc(doc(db, BROKERS_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Subscribes to real-time updates of Clients
 */
export function subscribeClients(onSuccess: (clients: Client[]) => void, onErr: (err: unknown) => void) {
  const collectionRef = collection(db, CLIENTS_COLLECTION);
  return onSnapshot(
    collectionRef,
    (snapshot) => {
      const list: Client[] = [];
      snapshot.forEach((docSnap) => list.push(docSnap.data() as Client));
      onSuccess(list);
    },
    (error) => {
      onErr(error);
      handleFirestoreError(error, OperationType.GET, CLIENTS_COLLECTION);
    }
  );
}

export async function saveClientToFirestore(client: Client): Promise<void> {
  const path = `${CLIENTS_COLLECTION}/${client.id}`;
  if (!auth.currentUser) {
    console.warn(`[Firestore Service] Skipping database write for path: ${path} (User is logged in via passcode only). Changes remain local.`);
    return;
  }
  try {
    await setDoc(doc(db, CLIENTS_COLLECTION, client.id), client);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteClientFromFirestore(id: string): Promise<void> {
  const path = `${CLIENTS_COLLECTION}/${id}`;
  if (!auth.currentUser) {
    console.warn(`[Firestore Service] Skipping database delete for path: ${path} (User is logged in via passcode only). Changes remain local.`);
    return;
  }
  try {
    await deleteDoc(doc(db, CLIENTS_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Subscribes to real-time updates of Leads
 */
export function subscribeLeads(onSuccess: (leads: Lead[]) => void, onErr: (err: unknown) => void) {
  const collectionRef = collection(db, LEADS_COLLECTION);
  return onSnapshot(
    collectionRef,
    (snapshot) => {
      const list: Lead[] = [];
      snapshot.forEach((docSnap) => list.push(docSnap.data() as Lead));
      onSuccess(list);
    },
    (error) => {
      onErr(error);
      handleFirestoreError(error, OperationType.GET, LEADS_COLLECTION);
    }
  );
}

export async function saveLeadToFirestore(lead: Lead, triggerEmail = true): Promise<void> {
  const path = `${LEADS_COLLECTION}/${lead.id}`;
  try {
    await setDoc(doc(db, LEADS_COLLECTION, lead.id), lead);

    if (triggerEmail) {
      // Non-blocking asynchronous trigger for administrator email dispatch
      fetch('/api/notify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'lead', data: lead })
      }).then((response) => {
        if (!response.ok) {
          console.warn('[CRM Notification Trigger received non-ok status]', response.status);
        }
      }).catch((err) => {
        console.warn('[CRM Notification Trigger failed]', err);
      });
    }

  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteLeadFromFirestore(id: string): Promise<void> {
  const path = `${LEADS_COLLECTION}/${id}`;
  if (!auth.currentUser) {
    console.warn(`[Firestore Service] Skipping database delete for path: ${path} (User is logged in via passcode only). Changes remain local.`);
    return;
  }
  try {
    await deleteDoc(doc(db, LEADS_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Subscribes to real-time updates of Visits
 */
export function subscribeVisits(onSuccess: (visits: Visit[]) => void, onErr: (err: unknown) => void) {
  const collectionRef = collection(db, VISITS_COLLECTION);
  return onSnapshot(
    collectionRef,
    (snapshot) => {
      const list: Visit[] = [];
      snapshot.forEach((docSnap) => list.push(docSnap.data() as Visit));
      onSuccess(list);
    },
    (error) => {
      onErr(error);
      handleFirestoreError(error, OperationType.GET, VISITS_COLLECTION);
    }
  );
}

export async function saveVisitToFirestore(visit: Visit): Promise<void> {
  const path = `${VISITS_COLLECTION}/${visit.id}`;
  try {
    await setDoc(doc(db, VISITS_COLLECTION, visit.id), visit);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteVisitFromFirestore(id: string): Promise<void> {
  const path = `${VISITS_COLLECTION}/${id}`;
  if (!auth.currentUser) {
    console.warn(`[Firestore Service] Skipping database delete for path: ${path} (User is logged in via passcode only). Changes remain local.`);
    return;
  }
  try {
    await deleteDoc(doc(db, VISITS_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Subscribes to real-time updates of Favorites
 */
export function subscribeFavorites(onSuccess: (favorites: Favorite[]) => void, onErr: (err: unknown) => void) {
  const collectionRef = collection(db, FAVORITES_COLLECTION);
  return onSnapshot(
    collectionRef,
    (snapshot) => {
      const list: Favorite[] = [];
      snapshot.forEach((docSnap) => list.push(docSnap.data() as Favorite));
      onSuccess(list);
    },
    (error) => {
      onErr(error);
      handleFirestoreError(error, OperationType.GET, FAVORITES_COLLECTION);
    }
  );
}

export async function saveFavoriteToFirestore(fav: Favorite): Promise<void> {
  const path = `${FAVORITES_COLLECTION}/${fav.id}`;
  if (!auth.currentUser) {
    console.warn(`[Firestore Service] Skipping database write for path: ${path} (User is not logged in).`);
    return;
  }
  try {
    await setDoc(doc(db, FAVORITES_COLLECTION, fav.id), fav);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteFavoriteFromFirestore(id: string): Promise<void> {
  const path = `${FAVORITES_COLLECTION}/${id}`;
  if (!auth.currentUser) {
    console.warn(`[Firestore Service] Skipping database delete for path: ${path} (User is not logged in).`);
    return;
  }
  try {
    await deleteDoc(doc(db, FAVORITES_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Subscribes to real-time updates of Messages
 */
export function subscribeMessages(onSuccess: (messages: Message[]) => void, onErr: (err: unknown) => void) {
  const collectionRef = collection(db, MESSAGES_COLLECTION);
  return onSnapshot(
    collectionRef,
    (snapshot) => {
      const list: Message[] = [];
      snapshot.forEach((docSnap) => list.push(docSnap.data() as Message));
      onSuccess(list);
    },
    (error) => {
      onErr(error);
      handleFirestoreError(error, OperationType.GET, MESSAGES_COLLECTION);
    }
  );
}

export async function saveMessageToFirestore(message: Message, triggerEmail = true): Promise<void> {
  const path = `${MESSAGES_COLLECTION}/${message.id}`;
  try {
    await setDoc(doc(db, MESSAGES_COLLECTION, message.id), message);

    if (triggerEmail) {
      // Non-blocking trigger of quick-contact email notifications
      fetch('/api/notify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'message', data: message })
      }).then((response) => {
        if (!response.ok) {
          console.warn('[CRM Notification Trigger received non-ok status]', response.status);
        }
      }).catch((err) => {
        console.warn('[CRM Notification Trigger failed]', err);
      });
    }

  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteMessageFromFirestore(id: string): Promise<void> {
  const path = `${MESSAGES_COLLECTION}/${id}`;
  if (!auth.currentUser) {
    console.warn(`[Firestore Service] Skipping database delete for path: ${path} (User is logged in via passcode only). Changes remain local.`);
    return;
  }
  try {
    await deleteDoc(doc(db, MESSAGES_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Seeds Firestore with default initial properties and banners if database is empty
 */
export async function seedInitialDatabase(): Promise<{ propertiesSeeded: number; bannersSeeded: number; settingsSeeded: boolean }> {
  let propertiesSeeded = 0;
  let bannersSeeded = 0;
  let settingsSeeded = false;

  try {
    // 1. Check properties
    const propsSnapshot = await getDocs(collection(db, PROPERTIES_COLLECTION));
    if (propsSnapshot.empty) {
      const batch = writeBatch(db);
      INITIAL_PROPERTIES.forEach((prop) => {
        const docRef = doc(db, PROPERTIES_COLLECTION, prop.id);
        batch.set(docRef, prop);
      });
      await batch.commit();
      propertiesSeeded = INITIAL_PROPERTIES.length;
    }

    // 2. Check banners
    const bannersSnapshot = await getDocs(collection(db, BANNERS_COLLECTION));
    if (bannersSnapshot.empty) {
      const batch = writeBatch(db);
      INITIAL_BANNERS.forEach((banner) => {
        const docRef = doc(db, BANNERS_COLLECTION, banner.id);
        batch.set(docRef, banner);
      });
      await batch.commit();
      bannersSeeded = INITIAL_BANNERS.length;
    }

    // 3. Check settings
    const settingsSnapshot = await getDocs(collection(db, SETTINGS_COLLECTION));
    if (settingsSnapshot.empty) {
      const docRef = doc(db, SETTINGS_COLLECTION, DEFAULT_BRAND_SETTINGS.id);
      await setDoc(docRef, DEFAULT_BRAND_SETTINGS);
      settingsSeeded = true;
    }

    return { propertiesSeeded, bannersSeeded, settingsSeeded };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'seed_database');
    throw error;
  }
}

