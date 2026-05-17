const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

/**
 * Sends a notification when a new message is sent in a match.
 */
exports.onMessageCreated = functions.region('asia-south1').firestore
    .document('matches/{matchId}/messages/{messageId}')
    .onCreate(async (snapshot, context) => {
        const messageData = snapshot.data();
        const matchId = context.params.matchId;

        // 1. Get the match document to find the receiver
        const matchDoc = await admin.firestore().collection('matches').doc(matchId).get();
        if (!matchDoc.exists) return null;

        const matchData = matchDoc.data();
        const receiverId = matchData.userIds.find(id => id !== messageData.senderId);

        // 2. Get the receiver's push token
        const userDoc = await admin.firestore().collection('users').doc(receiverId).get();
        if (!userDoc.exists) return null;

        const userData = userDoc.data();
        const pushToken = userData.pushToken;

        if (!pushToken) return null;

        // 3. Send the notification
        const message = {
            token: pushToken,
            notification: {
                title: 'New Message ☕',
                body: messageData.text.length > 50 ? messageData.text.substring(0, 47) + '...' : messageData.text,
            },
            android: {
                priority: 'high',
                notification: {
                    channelId: 'default_channel',
                    sound: 'default',
                    notificationPriority: 'PRIORITY_HIGH'
                }
            },
            data: {
                matchId: matchId,
                type: 'CHAT'
            }
        };

        return admin.messaging().send(message);
    });

/**
 * Sends a notification when a new intro (like) is received.
 */
exports.onIntroCreated = functions.region('asia-south1').firestore
    .document('intros/{introId}')
    .onCreate(async (snapshot, context) => {
        const introData = snapshot.data();
        const receiverId = introData.receiverId;

        // 1. Get the receiver's push token
        const userDoc = await admin.firestore().collection('users').doc(receiverId).get();
        if (!userDoc.exists) return null;

        const userData = userDoc.data();
        const pushToken = userData.pushToken;

        if (!pushToken) return null;

        // 2. Send the notification
        const message = {
            token: pushToken,
            notification: {
                title: 'New Interest! ❤️',
                body: `${introData.senderName} sent you an intro. Check it out!`,
            },
            android: {
                priority: 'high',
                notification: {
                    channelId: 'default_channel',
                    sound: 'default',
                    notificationPriority: 'PRIORITY_HIGH'
                }
            },
            data: {
                type: 'INTRO'
            }
        };

        return admin.messaging().send(message);
    });

/**
 * Sends a notification when someone visits a user's profile.
 */
exports.onVisitorCreated = functions.region('asia-south1').firestore
    .document('visitors/{visitorId}')
    .onCreate(async (snapshot, context) => {
        const visitorData = snapshot.data();
        const profileId = visitorData.profileId;

        // 1. Get the profile owner's push token
        const userDoc = await admin.firestore().collection('users').doc(profileId).get();
        if (!userDoc.exists) return null;

        const userData = userDoc.data();
        const pushToken = userData.pushToken;

        if (!pushToken) return null;

        // 2. Send the notification
        const message = {
            token: pushToken,
            notification: {
                title: 'New Visitor! 👀',
                body: `${visitorData.visitorName} checked out your profile.`,
            },
            android: {
                priority: 'high',
                notification: {
                    channelId: 'default_channel',
                    sound: 'default',
                    notificationPriority: 'PRIORITY_HIGH'
                }
            },
            data: {
                type: 'VISITOR'
            }
        };

        return admin.messaging().send(message);
    });
