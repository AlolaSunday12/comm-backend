const express = require('express');
const { expressjwt } = require('express-jwt');

const api = process.env.API_URL;

function authJwt() {
    const secret = process.env.secret;
    return expressjwt({
        secret,
        algorithms: ['HS256'],
        isRevoked: isRevoked
    }).unless({
        path: [
            {url: /\/api\/v1\/products(.*)/, methods: ['GET', 'OPTIONS']},
            {url: /\/api\/v1\/categories(.*)/, methods: ['GET', 'OPTIONS']},
            {url: /\/Public\/uploads(.*)/, methods: ['GET', 'OPTIONS']},
            {url: /\/api\/v1\/orders(.*)/,methods: ['GET', 'OPTIONS', 'POST']},
            `${api}/users/login`,
            `${api}/users/register`,
        ]
    })
}

async function isRevoked(req, token) {
    // Return true if the token should be revoked (i.e., user is not an admin)
    return !token.payload.isAdmin;
}

module.exports = authJwt;