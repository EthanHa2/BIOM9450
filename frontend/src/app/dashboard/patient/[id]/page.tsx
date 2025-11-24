export default function PatientDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  return <div> Patient ID: {params.id}</div>;
}
