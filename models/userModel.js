const fs = require('fs');
const path = require('path');
require('dotenv').config();


const dbPath = process.env.MONGODB_URL;


function loadUsers(){
    try{
        const data = fs.readFileSync(dbPath, "utf-8");
        return JSON.parse(data);
    }
    catch(err){
        return [];
    }
}

function saveUsers(users){
    fs.writeFileSync('db.json', JSON.stringify(users, null, 2));
}

function createUser(user){
    const users = loadUsers();
    user.id = users.length ? users[users.length - 1].id + 1: 1;
    users.push(user);
    saveUsers(users);
    return user;
}

function updateUser(id, updateUser){
    const users = loadUsers();
    const index = users.findIndex(user => user.id == id);
    if(index !== -1){
        users[index] = {...users[index], ...updateUser};
        saveUsers(users);
        return users[index];
    }
    return null;
}

function deleteUser(id){
    const users = loadUsers();
    const index = users.findIndex(user => user.id == id);
    if(index !== -1){
        const deletedUser = users.splice(index, 1);
        saveUsers(users);
        return deletedUser;
    }
    return null;
}

function getAllUsers(){
    return loadUsers();
}

module.exports = {
    createUser,
    updateUser,
    deleteUser,
    getAllUsers
};