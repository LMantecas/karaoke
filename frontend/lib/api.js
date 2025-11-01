import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const contestAPI = {
  createContest: (name, adminPassword) =>
    apiClient.post('/contest', { name, adminPassword }),
  
  getActiveContest: () =>
    apiClient.get('/contest/active'),
  
  startContest: (contestId, adminPassword, customRounds) =>
    apiClient.post(`/contest/${contestId}/start`, { adminPassword, customRounds }),
  
  getBracket: (contestId, adminPassword) =>
    apiClient.get(`/contest/${contestId}/bracket`, { params: { adminPassword } }),
  
  getCurrentMatch: (contestId) =>
    apiClient.get(`/contest/${contestId}/current-match`),
};

export const participantAPI = {
  register: (name, contestId) =>
    apiClient.post('/participants', { name, contestId }),
  
  getParticipants: (contestId) =>
    apiClient.get(`/contests/${contestId}/participants`),
  
  updateSong: (matchParticipantId, songName, participantCode) =>
    apiClient.put(`/match-participant/${matchParticipantId}/song`, { songName, participantCode }),
};

export const votingAPI = {
  startVoting: (matchId, adminPassword) =>
    apiClient.post(`/match/${matchId}/start-voting`, { adminPassword }),
  
  vote: (matchId, voterCode, votedForId, score) =>
    apiClient.post('/vote', { matchId, voterCode, votedForId, score }),
  
  adjustScore: (matchParticipantId, adjustment, reason, adminPassword) =>
    apiClient.post(`/match-participant/${matchParticipantId}/adjust-score`, { 
      adjustment, 
      reason, 
      adminPassword 
    }),
  
  finishMatch: (matchId, adminPassword) =>
    apiClient.post(`/match/${matchId}/finish`, { adminPassword }),
};

export default apiClient;
