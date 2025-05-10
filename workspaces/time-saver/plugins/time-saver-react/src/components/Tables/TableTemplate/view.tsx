import { Paper, Theme } from '@material-ui/core';
import {
  DataGrid,
  GridCallbackDetails,
  GridColDef,
  GridRowsProp,
  GridSortModel,
} from '@mui/x-data-grid';

export interface TableTemplateViewProps {
  rows?: GridRowsProp;
  theme: Theme;
  columns: GridColDef[];
  sortModel?: GridSortModel;
  onSortModelChange?: (
    model: GridSortModel,
    details: GridCallbackDetails,
  ) => void;
}

const TableTemplateView = (props: TableTemplateViewProps) => (
  <>
    <Paper
      style={{
        height: 400,
        width: '100%',
        // margin: '16px',
        padding: '16px',
        backgroundColor: props.theme.palette.background.paper,
      }}
    >
      <DataGrid
        rows={props.rows}
        columns={props.columns}
        sortModel={props.sortModel}
        onSortModelChange={props.onSortModelChange}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 5,
            },
          },
        }}
        pageSizeOptions={[5]}
        // checkboxSelection
        disableRowSelectionOnClick
        sx={{
          color: props.theme.palette.text.primary,
          '& .MuiDataGrid-cell:hover': {
            color: props.theme.palette.text.secondary,
          },
          '& .MuiDataGrid-footerContainer': {
            color: props.theme.palette.text.primary,
          },
          '& .v5-MuiToolbar-root': {
            color: props.theme.palette.text.primary,
          },
          '& .v5-MuiTablePagination-actions button': {
            color: props.theme.palette.text.primary,
          },
        }}
      />
    </Paper>
  </>
);
export default TableTemplateView;
