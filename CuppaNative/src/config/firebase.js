import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

// In Native Firebase, initialization happens automatically via google-services.json
const db = firestore();
const authInstance = auth();
const storageInstance = storage();

export { authInstance as auth, db, storageInstance as storage };
