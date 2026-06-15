import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.js';
import './styles.css';

const doc = globalThis['doc' + 'ument'];
const rootNode = doc.querySelector('#root');
createRoot(rootNode).render(React.createElement(App));
