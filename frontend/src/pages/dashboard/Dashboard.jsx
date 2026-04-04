import CandidatesTable from '../../components/CandidatesTable';
import FiltersPanel from '../../components/FiltersPanel';
import JDMatchPanel from '../../components/JDMatchPanel';

export default function Dashboard() {
  return (
    <div className='flex gap-6 h-full'>
      {/* Left sidebar — filters + JD match */}
      <div className='w-64 shrink-0 space-y-4'>
        <FiltersPanel />
        <JDMatchPanel />
      </div>

      {/* Main content — candidates table */}
      <div className='flex-1 min-w-0'>
        <CandidatesTable />
      </div>
    </div>
  );
}
