export interface Contact {
  name: string;
  phone: string;
}

export interface WeatherInfo {
  location: string;
  temperature: string;
  condition: string;
}

export interface NewsItem {
  title: string;
  source: string;
  url: string;
}

export enum VancixState {
  IDLE = 'IDLE',
  LISTENING = 'LISTENING',
  THINKING = 'THINKING',
  SPEAKING = 'SPEAKING',
  ERROR = 'ERROR'
}

export interface LogEntry {
  type: 'user' | 'agent' | 'system';
  text: string;
  timestamp: Date;
}