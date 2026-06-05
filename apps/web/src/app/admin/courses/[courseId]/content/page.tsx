import AdminCourseContentWorkspaceClient from "./workspace-client";

export default async function AdminCourseContentPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  return <AdminCourseContentWorkspaceClient courseId={courseId} />;
}
