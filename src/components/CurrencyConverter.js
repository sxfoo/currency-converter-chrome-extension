import React, { useState, useEffect } from 'react';
import { fetchRates, saveRates, loadRates, getExchangeRate } from '../backend/CurrencyService';
import { currencyOptions } from '../backend/CurrencyOptions';

import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';

import InputAdornment from '@mui/material/InputAdornment';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';

const CurrencyAutocomplete = ({ value, onChange, options }) => (
  <Autocomplete
    disableClearable
    value={options.find(option => option.value === value) || options[0]}
    onChange={(event, newValue) => {
      onChange({ target: { value: newValue ? newValue.value : options[0].value } });
    }}
    options={options}
    getOptionLabel={(option) => option.label}
    renderInput={(params) => <TextField {...params} variant="standard" />}
    sx={{ width: 150,
      '& .MuiInputBase-root': {
        fontSize: '0.75rem', 
      },
      '& .MuiAutocomplete-option': {
        fontSize: '0.75rem',
      }
     }}
  />
);

const CurrencyInput = ({ value, onChange, currencyValue, setCurrencyValue, currencyOptions, id }) => (
  <TextField
    fullWidth
    variant="outlined"
    value={value}
    onChange={onChange}
    InputProps={{
      endAdornment: (
        <InputAdornment position="end">
          <CurrencyAutocomplete
            value={currencyValue}
            onChange={(e) => setCurrencyValue(e.target.value)}
            options={currencyOptions}
          />
        </InputAdornment>
      ),
    }}
  />
);

const CurrencyConverter = () => {
  const [fromCurrency, setFromCurrency] = useState(() => localStorage.getItem('fromCurrency') || 'SGD')
  const [toCurrency, setToCurrency] = useState(() => localStorage.getItem('toCurrency') || 'USD');
  const [amount, setAmount] = useState('1');
  const [result, setResult] = useState('0');
  const [rates, setRates] = useState(null);
  const [baseRate, setBaseRate] = useState('0')
  const [lastUpdated, setLastUpdated] = useState('');
  const [activeInput, setActiveInput] = useState('from');

  const initRates = async () => {
    let result = await loadRates();
    
    if (result) {
      const { rates, timestamp } = result;
      const timestampInt = parseInt(timestamp, 10);
      const date = new Date(timestampInt);
      const utcString = date.toUTCString();

      setRates(rates);
      setLastUpdated(utcString);
    } else {
      let loadedRates = await fetchRates();
      let savedDate = await saveRates(loadedRates);

      const timestampInt = parseInt(savedDate, 10);
      const date = new Date(timestampInt);
      const utcString = date.toUTCString();

      setRates(loadedRates);
      setLastUpdated(utcString);
    }
  };

  function toSignificantFigures(num, sf) {
    if (num === 0) return '0';
    const format = num.toPrecision(sf);
    return parseFloat(format).toString();
  }

  const formatCurrencyValue = (value) => {
    if (value === '') return '';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '';
    
    // Use 2 significant figures for small numbers, otherwise use 2 decimal places
    if (Math.abs(numValue) < 0.1) {
      return toSignificantFigures(numValue, 2);
    } else {
      return numValue.toFixed(2);
    }
  };

  useEffect(() => {
    initRates();
    const interval = setInterval(() => {
      initRates();
    }, 61 * 60 * 1000); // Update every hour + 1 minute

    return () => clearInterval(interval); // Cleanup
  }, []);

  useEffect(() => {
    localStorage.setItem('fromCurrency', fromCurrency);
    localStorage.setItem('toCurrency', toCurrency);

    if (rates) {
      const rate = getExchangeRate(rates, fromCurrency, toCurrency);
      setBaseRate(formatCurrencyValue(rate))

      if (activeInput === 'from') {
        if (amount === '') {
          setResult('');
        } else {
          const convertedAmount = parseFloat(amount) * rate;
          setResult(formatCurrencyValue(convertedAmount));
        }
      } else {
        if (result === '') {
          setAmount('');
        } else {
          const convertedAmount = parseFloat(result) / rate;
          setAmount(formatCurrencyValue(convertedAmount));
        }
      }
    }
  }, [amount, result, fromCurrency, toCurrency, rates, activeInput]);

  const handleFromAmountChange = (event) => {
    const value = event.target.value;
    if (value === '' || (!isNaN(parseFloat(value)) && isFinite(value))) {
      setAmount(value);
      setActiveInput('from');
    }
  };

  const handleToAmountChange = (event) => {
    const value = event.target.value;
    if (value === '' || (!isNaN(parseFloat(value)) && isFinite(value))) {
      setResult(value);
      setActiveInput('to');
    }
  };

  const getCurrencyLabel = (value) => {
    const currency = currencyOptions.find(option => option.value === value);
    return currency ? currency.label : '';
  };

  return (
    <div style={{ width: 300, padding: 16 }}>
      <Typography variant="h6">
        1 {getCurrencyLabel(fromCurrency)} equals 
      </Typography>
      <Typography variant="h6">
      {baseRate} {getCurrencyLabel(toCurrency)}
      </Typography>
      <Typography variant="body2" color="textSecondary">
        Updated {lastUpdated}
      </Typography>
      <Link target="_blank" href="https://www.exchangerate-api.com" underline="none" variant="caption">
        {"Rates By Exchange Rate API"} 
      </Link>

      <Grid container spacing={2} style={{ marginTop: 4 }}>
        <Grid item xs={12}>
          <CurrencyInput
            value={amount}
            onChange={handleFromAmountChange}
            currencyValue={fromCurrency}
            setCurrencyValue={(value) => {
              setFromCurrency(value);
              setActiveInput('from');
            }}
            currencyOptions={currencyOptions}
            id="from"
          />
        </Grid>
        <Grid item xs={12}>
          <CurrencyInput
            value={result}
            onChange={handleToAmountChange}
            currencyValue={toCurrency}
            setCurrencyValue={(value) => {
              setToCurrency(value);
              setActiveInput('to');
            }}
            currencyOptions={currencyOptions}
            id="to"
          />
        </Grid>
      </Grid>
    </div>
  );
};

export default CurrencyConverter;
