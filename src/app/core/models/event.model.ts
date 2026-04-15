export interface Event {
  eventId: number;
  title: string;
  description: string;
  eventDate: string | null;
  location: string;
  fee: number;
  paid: boolean;
  status: string;
  club: {
    clubId: number;
    clubName: string;
  };
}