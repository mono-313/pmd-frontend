export interface BaseInfoOption {
  Value: string;
  Text: string;
  Selected: boolean;
  Disabled: boolean;
  Group: string | null;
}

export interface BaseInfoResponse {
  IsSuccess: boolean;
  Message: string | null;
  Data: BaseInfoOption[];
}