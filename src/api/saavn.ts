const BASE_URL = 'https://saavn.sumit.co';

export async function searchSongs(query: string, page = 1) {
  try {
    const response = await fetch(
      `${BASE_URL}/api/search/songs?query=${encodeURIComponent(query)}&page=${page}`
    );
    const json = await response.json();
    return json.data;
  } catch (error) {
    console.error('Error fetching songs', error);
    throw error;
  }
}

export async function searchAlbums(query: string, page = 1) {
  try {
    const response = await fetch(
      `${BASE_URL}/api/search/albums?query=${encodeURIComponent(query)}&page=${page}`
    );
    const json = await response.json();
    return json.data;
  } catch (error) {
    console.error('Error fetching albums', error);
    throw error;
  }
}

export async function searchArtists(query: string, page = 1) {
  try {
    const response = await fetch(
      `${BASE_URL}/api/search/artists?query=${encodeURIComponent(query)}&page=${page}`
    );
    const json = await response.json();
    return json.data;
  } catch (error) {
    console.error('Error fetching artists', error);
    throw error;
  }
}

export async function searchPlaylists(query: string, page = 1) {
  try {
    const response = await fetch(
      `${BASE_URL}/api/search/playlists?query=${encodeURIComponent(query)}&page=${page}`
    );
    const json = await response.json();
    return json.data;
  } catch (error) {
    console.error('Error fetching playlists', error);
    throw error;
  }
}

export async function getSongDetails(id: string) {
  try {
    const response = await fetch(`${BASE_URL}/api/songs/${id}`);
    const json = await response.json();
    return json.data?.[0];
  } catch (error) {
    console.error('Error fetching song details', error);
    throw error;
  }
}

export async function getArtistDetails(id: string) {
  try {
    const response = await fetch(`${BASE_URL}/api/artists/${id}`);
    const json = await response.json();
    return json.data;
  } catch (error) {
    console.error('Error fetching artist details', error);
    throw error;
  }
}

export async function getArtistSongs(id: string) {
  try {
    const response = await fetch(`${BASE_URL}/api/artists/${id}/songs`);
    const json = await response.json();
    return json.data;
  } catch (error) {
    console.error('Error fetching artist songs', error);
    throw error;
  }
}

export async function getArtistAlbums(id: string) {
  try {
    const response = await fetch(`${BASE_URL}/api/artists/${id}/albums`);
    const json = await response.json();
    return json.data;
  } catch (error) {
    console.error('Error fetching artist albums', error);
    throw error;
  }
}

export async function getAlbumDetails(id: string) {
  try {
    const response = await fetch(`${BASE_URL}/api/albums/${id}`);
    const json = await response.json();
    console.log('getAlbumDetails raw response:', json);
    // Return the full response, not just json.data
    return json.data || json;
  } catch (error) {
    console.error('Error fetching album details', error);
    throw error;
  }
}

export async function getAlbumSongs(id: string) {
  try {
    const response = await fetch(`${BASE_URL}/api/albums/${id}/songs`);
    const json = await response.json();
    console.log('getAlbumSongs raw response:', JSON.stringify(json, null, 2));
    // Return the full response, not just json.data
    return json.data || json;
  } catch (error) {
    console.error('Error fetching album songs', error);
    throw error;
  }
}
