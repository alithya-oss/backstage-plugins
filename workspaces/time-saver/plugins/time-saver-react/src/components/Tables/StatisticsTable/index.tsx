import { useState } from 'react';
import { TableTemplate } from '../TableTemplate';
import { useStatistics } from '../../../hooks';
import { isTimeSaverApiError } from '@alithya-oss/backstage-plugin-time-saver-common';
import { GridColDef, GridSortModel } from '@mui/x-data-grid';
import { CircularProgress } from '@material-ui/core';

type TableRow =
  | {
      id: string;
      team: string;
      templateName: string;
      timeSaved: number;
    }
  | {
      id: string;
      timeSaved: number;
      team: string;
    }
  | {
      id: string;
      timeSaved: number;
      templateName: string;
    };

/**
 * Props for {@link StatisticsTable}.
 *
 * @public
 */
export interface StatisticsTableProps {
  teamName?: string;
  templateName?: string;
}

/**
 * Displays a table from a time-saved statistics dataset.
 *
 * @public
 */
const StatisticsTable = (props: StatisticsTableProps) => {
  const apiResult = useStatistics({ ...props });
  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: 'timeSaved', sort: 'asc' },
  ]);
  const { loading, error, items } = apiResult;

  if (!!items) {
    if (isTimeSaverApiError(items)) {
      return <>Time Saver Api Error</>;
    }

    const enhancedItems = items.map((stat, index) => ({
      ...stat,
      id: index.toString(),
    }));

    const columns: GridColDef[] = [
      {
        field: 'team',
        headerName: 'Team',
        flex: 1,
        sortable: true,
      },
      {
        field: 'templateName',
        headerName: 'Template Name',
        flex: 1,
        sortable: true,
      },
      {
        field: 'timeSaved',
        headerName: 'Sum',
        flex: 1,
        sortable: true,
      },
    ].filter((col: { field: string }) =>
      enhancedItems.some((row: TableRow) => !!row[col.field as keyof TableRow]),
    );

    return (
      <TableTemplate
        rows={enhancedItems}
        columns={columns}
        sortModel={sortModel}
        onSortModelChange={model => setSortModel(model)}
      />
    );
  }

  return (
    <>
      <>{loading && <CircularProgress />}</>
      <>{error ? `Error: ${apiResult.error}` : ''}</>
    </>
  );
};
export default StatisticsTable;
