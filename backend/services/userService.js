const UserProfile = require('../models/user.model');

exports.findOrCreateUser = async (data) => {
    let user = await UserProfile.findOne({ username: data.username });
    if (!user) {
        user = new UserProfile(data);
    } else {
        // Actualizar datos de sesión (chatname, avatar, última actividad)
        user.chatname = data.chatname;
        user.avatarUrl = data.avatarUrl;
        user.lastActive = Date.now();
    }
    await user.save();
    return user;
};

exports.updateUserRank = async (username, newRank) => {
    return UserProfile.updateOne({ username }, { rank: newRank });
};