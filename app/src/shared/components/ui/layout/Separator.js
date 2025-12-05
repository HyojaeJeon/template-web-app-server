import React from 'react';
import { View } from 'react-native';

export const SectionSeparator = ({
  type = 'default',
  className = '',
  style = {}}) => {
  const separatorConfig = {
    default: {
      height: 2,
      backgroundColor: 'rgba(229, 231, 235, 0.8)',
      className: 'mx-4'},
    theme: {
      height: 2,
      backgroundColor: 'rgba(42, 193, 188, 0.3)',
      className: 'mx-4'},
    strong: {
      height: 2,
      backgroundColor: 'rgba(42, 193, 188, 0.6)',
      className: 'mx-4'},
    invisible: {
      height: 24,
      backgroundColor: 'transparent',
      className: ''}};

  const config = separatorConfig[type] || separatorConfig.default;

  return (
    <View
      className={`${config.className} ${className}`}
      style={[
        {
          height: config.height,
          backgroundColor: config.backgroundColor},
        style,
      ]}
    />
  );
};

export const SectionSpacer = ({ height = 24 }) => (
  <View style={{ height }} />
);

export default SectionSeparator;
