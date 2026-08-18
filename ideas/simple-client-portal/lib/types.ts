export type Project = {
  id: string;
  freelancer_id: string;
  name: string;
  description: string | null;
  created_at: string;
};

export type ProjectClient = {
  id: string;
  project_id: string;
  client_email: string;
  invited_at: string;
};

export type ProjectUpdate = {
  id: string;
  project_id: string;
  author_id: string;
  body: string;
  created_at: string;
};

export type ProjectFile = {
  id: string;
  project_id: string;
  uploaded_by: string;
  storage_path: string;
  file_name: string;
  size_bytes: number | null;
  content_type: string | null;
  created_at: string;
};
