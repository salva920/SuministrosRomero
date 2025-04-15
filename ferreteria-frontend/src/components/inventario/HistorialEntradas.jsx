import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Typography, TextField, InputAdornment, Pagination, Box, 
  styled, useTheme, IconButton, Button, Menu, MenuItem, Tooltip, Chip,
  CircularProgress, Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterAlt as FilterIcon,
  FileDownload as ExportIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon
} from '@mui/icons-material';
import { saveAs } from 'file-saver';
import { debounce } from 'lodash';
import moment from 'moment';

const API_URL = 'http://localhost:5000/api';

const HistorialEntradas = () => {
  const theme = useTheme();
  
  // Estados
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: '_fechaOrdenable', direction: 'desc' });
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [dateFilter, setDateFilter] = useState({ start: null, end: null });
  const openFilter = Boolean(filterAnchorEl);

  // Hooks de efecto y callbacks
  const debouncedSearch = useCallback(
    debounce((term) => {
      setDebouncedSearchTerm(term);
      setPage(1);
    }, 300),
    []
  );

  const fetchHistorial = useCallback(async () => {
    try {
      const url = `${API_URL}/historial`;
      const params = {
        page,
        limit: rowsPerPage,
        search: debouncedSearchTerm,
        startDate: dateFilter.start,
        endDate: dateFilter.end,
        tipo: 'entrada'
      };

      console.log('Solicitando historial desde:', url, 'con parámetros:', params);

      const response = await axios.get(url, { params });

      console.log('Respuesta de la API:', response.data);
      
      if (response.data && response.data.historial) {
        setHistorial(response.data.historial.map(item => ({
          ...item,
          fecha: new Date(item.fecha),
          _fechaOrdenable: item.fecha
        })));
      } else {
        throw new Error('Estructura de respuesta inválida');
      }
      
    } catch (err) {
      console.error('Error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Error al cargar el historial');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, sortConfig, debouncedSearchTerm, dateFilter]);

  const sortedHistorial = useCallback(() => {
    const sortableItems = [...historial];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [historial, sortConfig]);

  // Efectos
  useEffect(() => {
    debouncedSearch(searchTerm);
    return () => debouncedSearch.cancel();
  }, [searchTerm, debouncedSearch]);

  useEffect(() => {
    fetchHistorial();
  }, [fetchHistorial]);

  // Handlers
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleDateFilterChange = (type, value) => {
    setDateFilter(prev => ({ ...prev, [type]: value }));
    setPage(1);
  };

  const clearDateFilter = () => {
    setDateFilter({ start: null, end: null });
    setPage(1);
  };

  // Cálculos derivados
  const filteredHistorial = sortedHistorial().filter(entrada => {
    const matchesSearch = debouncedSearchTerm === '' || 
      entrada.codigoProducto.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
    
    const matchesDate = (!dateFilter.start || entrada.fecha >= new Date(dateFilter.start)) &&
      (!dateFilter.end || entrada.fecha <= new Date(dateFilter.end));
    
    return matchesSearch && matchesDate;
  });

  const indexOfLastRow = page * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredHistorial.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredHistorial.length / rowsPerPage);

  // Estilos
  const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
      transition: 'background-color 0.2s ease',
    },
    '&:last-child td, &:last-child th': { border: 0 },
  }));

  const StyledTableCell = styled(TableCell)(({ theme }) => ({
    fontWeight: 500,
    color: theme.palette.text.primary,
    fontSize: '0.875rem',
  }));

  const HeaderTableCell = styled(TableCell)(({ theme }) => ({
    fontWeight: 'bold',
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    fontSize: '1rem',
    cursor: 'pointer',
    '&:hover': { backgroundColor: theme.palette.primary.dark },
  }));

  // Render condicional
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Paper elevation={3} sx={{ mt: 3, p: 3, borderRadius: 2, boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)' }}>
      {/* Header y controles */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: '1.5rem' }}>
          Historial de Entradas
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            variant="outlined"
            placeholder="Buscar por código o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon color="action" />,
              endAdornment: searchTerm && (
                <IconButton onClick={() => setSearchTerm('')} size="small">
                  <ClearIcon fontSize="small" />
                </IconButton>
              ),
              sx: { borderRadius: '25px', backgroundColor: 'background.paper', minWidth: '300px' }
            }}
          />
          
          <Tooltip title="Filtrar por fecha">
            <IconButton
              onClick={handleFilterClick}
              color={dateFilter.start || dateFilter.end ? 'primary' : 'default'}
              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
            >
              <FilterIcon />
            </IconButton>
          </Tooltip>
          
          <Button
            variant="contained"
            startIcon={<ExportIcon />}
            onClick={() => {
              const csvContent = [
                ['Producto', 'Código', 'Cantidad', 'Stock Anterior', 'Stock Nuevo', 'Fecha y Hora', 'Operación'],
                ...filteredHistorial.map(entrada => [
                  `"${entrada.nombreProducto.replace(/"/g, '""')}"`,
                  entrada.codigoProducto,
                  `+${entrada.cantidad}`,
                  entrada.stockAnterior,
                  entrada.stockNuevo,
                  `"${moment(entrada.fecha).format('DD/MM/YYYY HH:mm')}"`,
                  entrada.operacion.toUpperCase()
                ])
              ].join('\n');
              
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              saveAs(blob, 'historial_entradas.csv');
            }}
            sx={{ borderRadius: '25px', textTransform: 'none', px: 3 }}
          >
            Exportar
          </Button>
        </Box>
      </Box>

      {/* Filtros y tabla */}
      <Menu
        anchorEl={filterAnchorEl}
        open={openFilter}
        onClose={handleFilterClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem disabled><Typography variant="subtitle2">Filtrar por fecha</Typography></MenuItem>
        <MenuItem sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
          <Typography variant="caption" sx={{ mb: 1 }}>Desde:</Typography>
          <TextField
            type="date"
            value={dateFilter.start || ''}
            onChange={(e) => handleDateFilterChange('start', e.target.value)}
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
          />
        </MenuItem>
        <MenuItem sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
          <Typography variant="caption" sx={{ mb: 1 }}>Hasta:</Typography>
          <TextField
            type="date"
            value={dateFilter.end || ''}
            onChange={(e) => handleDateFilterChange('end', e.target.value)}
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
          />
        </MenuItem>
        <MenuItem onClick={clearDateFilter} disabled={!dateFilter.start && !dateFilter.end}>
          <Typography variant="body2" color="primary">Limpiar filtros</Typography>
        </MenuItem>
      </Menu>

      {(dateFilter.start || dateFilter.end) && (
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Filtrado por fechas: 
          </Typography>
          {dateFilter.start && <Typography variant="body2" sx={{ fontWeight: 500 }}>
            Desde: {new Date(dateFilter.start).toLocaleDateString('es-ES')}
          </Typography>}
          {dateFilter.end && <Typography variant="body2" sx={{ fontWeight: 500 }}>
            Hasta: {new Date(dateFilter.end).toLocaleDateString('es-ES')}
          </Typography>}
          <IconButton size="small" onClick={clearDateFilter}>
            <ClearIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      <TableContainer component={Paper} elevation={0} sx={{ mb: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              {['nombreProducto', 'codigoProducto', 'cantidad', 'stockAnterior', 'stockNuevo', 'costoFinal', 'fecha', 'operacion'].map((header) => (
                <HeaderTableCell 
                  key={header}
                  align={header === 'operacion' ? 'center' : 'right'}
                  onClick={() => requestSort(header === 'fecha' ? '_fechaOrdenable' : header)}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: header === 'nombreProducto' ? 'flex-start' : 'flex-end'
                  }}>
                    {{
                      nombreProducto: 'Producto',
                      codigoProducto: 'Código',
                      cantidad: 'Cantidad',
                      stockAnterior: 'Stock Anterior',
                      stockNuevo: 'Stock Nuevo',
                      costoFinal: 'Costo Final',
                      fecha: 'Fecha y Hora',
                      operacion: 'Operación'
                    }[header]}
                    {sortConfig.key === (header === 'fecha' ? '_fechaOrdenable' : header) && (
                      sortConfig.direction === 'asc' ? 
                        <ArrowUpIcon fontSize="small" sx={{ ml: 0.5 }} /> : 
                        <ArrowDownIcon fontSize="small" sx={{ ml: 0.5 }} />
                    )}
                  </Box>
                </HeaderTableCell>
              ))}
            </TableRow>
          </TableHead>
          
          <TableBody>
            {currentRows.map((entrada) => (
              <StyledTableRow key={`${entrada.fecha}-${entrada.codigoProducto}`}>
                <StyledTableCell>{entrada.nombreProducto}</StyledTableCell>
                <StyledTableCell align="right">{entrada.codigoProducto}</StyledTableCell>
                <StyledTableCell align="right">
                  <Chip 
                    label={`+${entrada.cantidad}`} 
                    color="success" 
                    variant="outlined" 
                  />
                </StyledTableCell>
                <StyledTableCell align="right">{entrada.stockAnterior}</StyledTableCell>
                <StyledTableCell align="right">
                  {entrada.stockNuevo}
                </StyledTableCell>
                <StyledTableCell align="right">
                  {moment(entrada.fecha).format('DD/MM/YYYY HH:mm')}
                </StyledTableCell>
                <StyledTableCell align="center">
                  <Chip
                    label={
                      entrada.operacion === 'creacion' ? 'Creación' :
                      entrada.operacion === 'entrada' ? 'Entrada' : 
                      'Ajuste'
                    }
                    color={
                      entrada.operacion === 'creacion' ? 'primary' :
                      entrada.operacion === 'entrada' ? 'success' : 
                      'warning'
                    }
                  />
                </StyledTableCell>
              </StyledTableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Paginación y mensajes */}
      {filteredHistorial.length === 0 ? (
        <Typography variant="body1" sx={{ textAlign: 'center', p: 3, color: 'text.secondary' }}>
          {searchTerm || dateFilter.start || dateFilter.end ? 
            'No se encontraron resultados' : 
            'No hay registros disponibles'}
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Mostrando {indexOfFirstRow + 1}-{Math.min(indexOfLastRow, filteredHistorial.length)} de {filteredHistorial.length}
          </Typography>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(e, newPage) => setPage(newPage)}
            color="primary"
            shape="rounded"
            showFirstButton
            showLastButton
            sx={{
              '& .MuiPaginationItem-root': {
                color: 'primary.main',
                '&.Mui-selected': { backgroundColor: 'primary.main', color: 'common.white' }
              }
            }}
          />
        </Box>
      )}
    </Paper>
  );
};

export default HistorialEntradas;