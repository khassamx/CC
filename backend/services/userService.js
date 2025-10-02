const UserProfile = require('../models/user.model');

exports.findOrCreateUser = async (data) => {
    let user = await UserProfile.findOne({ username: data.username });
    if (!user) {
        user = new UserProfile(data);
        await user.save();
    } else {
        // Actualizar datos no persistentes como chatname/avatarUrl
        user.chatname = data.chatname;
        user.avatarUrl = data.avatarUrl;
        await user.save();
    }
    return user;
};

exports.updateUserRank = async (username, newRank) => {
    return UserProfile.updateOne({ username }, { rank: newRank });
};