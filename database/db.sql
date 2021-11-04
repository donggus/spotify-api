CREATE DATABASE fitback_challenge;

\l

\c fitback_challenge;

CREATE TABLE artists (
    id SERIAL PRIMARY KEY,
    name VARCHAR(400),
    songs TEXT []
);