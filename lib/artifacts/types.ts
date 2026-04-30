export type ArtifactStatus = "assess" | "trial" | "adopt";

export type IsoDateString = string;

export type Artifact = {
  id: string;
  url: string;
  title: string;
  researchSummary: string;
  tldr: string | null;
  coverUrl: string | null;
  status: ArtifactStatus;
  endorsementCount: number;
  readAt: IsoDateString | null;
  createdAt: IsoDateString;
  publishedAt: IsoDateString | null;
  lastInteractedAt: IsoDateString;
  maturityUpdatedAt: IsoDateString | null;
  sourceTextHash: string | null;
};

export type ArtifactsFile = {
  version: 1;
  artifacts: Artifact[];
};

