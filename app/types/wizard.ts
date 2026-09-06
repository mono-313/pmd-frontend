import type {
  ExpertOption,
} from "@/app/types/expert";


export interface Program {
  id: number;
  name: string;
  networkId: number;
}

export interface SpecificationsFormData {
  planId: number | null;
  broadcastDate: string;
  mainTopic: string;
  hasExpert: boolean;
  broadcastDateJalali: string;
}

export type TopicStatus =
  | "Draft"
  | "PendingReview"
  | "Approved"
  | "Rejected";

  
export interface Topic {
  id: string;

  title: string;

  registeredAt: string;

  status: TopicStatus;
}

export interface WizardFormData {
  specifications: SpecificationsFormData;

  topics: Topic[];

  experts: ExpertOption[];
}