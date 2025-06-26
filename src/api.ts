import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';;

export interface Question {
  _id: string;
  company: string;
  question: string;
  link: string;
  level: string;
  solvedByAditya: boolean;
  solvedByAnanya: boolean;
  winner: 'Aditya' | 'Ananya' | null;
}

export const getQuestions = async (): Promise<Question[]> => {
  const response = await axios.get(`${API_URL}/questions`);
  return response.data;
};

export const getRandomQuestions = async (count: number): Promise<Question[]> => {
  const response = await axios.get(`${API_URL}/random-questions?count=${count}`);
  return response.data;
};

export const solveQuestion = async (id: string, solver: 'Aditya' | 'Ananya', solved: boolean): Promise<Question> => {
  const response = await axios.patch(`${API_URL}/questions/${id}/solve`, { solver, solved });
  return response.data;
};

export interface Contest {
  code: string;
  questions: Question[];
  startTime: string;
  endTime: string;
  duration: number;
  status: 'live' | 'finished';
  solves: Array<{
    user: 'Aditya' | 'Ananya';
    question: string;
    solved: boolean;
    timestamp: string;
  }>;
  winner: 'Aditya' | 'Ananya' | null;
}

export const createContest = async (numQuestions: number, duration: number): Promise<Contest> => {
  const response = await axios.post(`${API_URL}/contests`, { numQuestions, duration });
  return response.data;
};

export const getLiveContests = async (): Promise<Contest[]> => {
  const response = await axios.get(`${API_URL}/contests/live`);
  return response.data;
};

export const getContestByCode = async (code: string): Promise<Contest> => {
  const response = await axios.get(`${API_URL}/contests/${code}`);
  return response.data;
};

export const solveContestQuestion = async (
  code: string,
  user: 'Aditya' | 'Ananya',
  questionId: string,
  solved: boolean
): Promise<Contest> => {
  const response = await axios.post(`${API_URL}/contests/${code}/solve`, { user, questionId, solved });
  return response.data;
};

export const getPastContests = async (): Promise<Contest[]> => {
  const response = await axios.get(`${API_URL}/contests/past`);
  return response.data;
};

export const addQuestion = async (data: {
  company: string;
  question: string;
  link: string;
  level: string;
}): Promise<Question> => {
  const response = await axios.post(`${API_URL}/questions`, data);
  return response.data;
}; 