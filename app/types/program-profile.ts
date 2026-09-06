
export interface ProgramProfileCrewMember {
  personnelId: number;

  personnelName: string;

  activityTypeId: number;

  activityTypeName: string;

  isPresent: boolean;
}

export interface ProgramProfilePagination {
  currentPage: number;

  pageSize: number;

  totalCount: number;

  totalPages: number;

  hasPrevious: boolean;

  hasNext: boolean;
}

export interface ProgramProfileItem {
  itemName: string;

  productionType: string;

  duration: string;
}


export interface ProgramProfileExpert {
  expertId: string;

  topicAxisId: string;

  duration: string;

  attendanceType: string;

  hasPayment: boolean;
}


export interface ProgramProfileResponse {
  id: string;

  forecastId: string;

  planId: number;

  networkId: number;

  networkGroupId: number;

  mainTopic: string;

  duration: string;

  broadcastDate: string;

  productionMethod: string;

  occasion: string;

  floorId: number;

  floorName: string;

  programDegreeId: number;

  programDegreeName: string;

  programStructureId: number;

  programStructureName: string;

  startTime: string;

  hasExpert: boolean;

  crewMembers:
    ProgramProfileCrewMember[];

  items:
    ProgramProfileItem[];

  experts:
    ProgramProfileExpert[];

  createdByUserId: string;

  createdByUserName: string;

  createdDate: string;
}


export interface ProgramProfileListResponse {
  items:
    ProgramProfileResponse[];

  pagination:
    ProgramProfilePagination;
}


