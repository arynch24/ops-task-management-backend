import axios from 'axios';
import { config } from '../config';

interface GoogleUser {
    id: string;
    email: string;
    verified_email: boolean;
    name: string;
    given_name: string;
    family_name: string;
    picture: string;
    locale: string;
}

export const getGoogleUser = async (code: string): Promise<GoogleUser> => {
    const url = 'https://oauth2.googleapis.com/token';
    const data = {
        code,
        client_id: config.googleClientId,
        client_secret: config.googleClientSecret,
        redirect_uri: config.googleRedirectUri,
        grant_type: 'authorization_code',
    };

    // Step 1: Get access token
    const response = await axios.post(url, data);
    const { access_token } = response.data;

    // Step 2: Get user info
    const userInfo = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` },
    });

    return userInfo.data;
};