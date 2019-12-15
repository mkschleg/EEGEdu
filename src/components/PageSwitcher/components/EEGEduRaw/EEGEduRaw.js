import React from "react";
import { catchError, multicast } from "rxjs/operators";
import { Subject } from "rxjs";

import { TextContainer, Card, Stack, RangeSlider } from "@shopify/polaris";

import { channelNames } from "muse-js";
import { Line } from "react-chartjs-2";

import { zipSamples } from "muse-js";

import {
  bandpassFilter,
  epoch
} from "@neurosity/pipes";

import { chartStyles, generalOptions } from "../chartOptions";

import * as generalTranslations from "../translations/en";
import * as specificTranslations from "./translations/en";

import { generateXTics, standardDeviation } from "../../utils/chartUtils";

export function getRawSettings () {
  const settingsRaw = {
    cutOffLow: 2,
    cutOffHigh: 20,
    nbChannels: 4,
    interval: 50,
    srate: 256,
    duration: 1024
  }
  return settingsRaw
};

export function buildPipeRaw(rawPipeSettings) {
  if (window.subscriptionRaw$) window.subscriptionRaw$.unsubscribe();

  window.pipeRaw$ = null;
  window.multicastRaw$ = null;
  window.subscriptionRaw$ = null;

  // Build Pipe Raw
  window.pipeRaw$ = zipSamples(window.source$.eegReadings).pipe(
    bandpassFilter({ cutoffFrequencies: [rawPipeSettings.cutOffLow, rawPipeSettings.cutOffHigh], nbChannels: rawPipeSettings.nbChannels }),
    epoch({
      duration: rawPipeSettings.duration,
      interval: rawPipeSettings.interval,
      samplingRate: rawPipeSettings.srate
    }),
    catchError(err => {
      console.log(err);
    })
  );
  window.multicastRaw$ = window.pipeRaw$.pipe(
    multicast(() => new Subject())
  );
}

export function setupRaw(setRawData, rawPipeSettings) {
  console.log("Subscribing to Raw");

  if (window.multicastRaw$) {
    window.subscriptionRaw$ = window.multicastRaw$.subscribe(data => {
      setRawData(rawData => {
        Object.values(rawData).forEach((channel, index) => {
          if (index < 4) {
            channel.datasets[0].data = data.data[index];
            channel.xLabels = generateXTics(rawPipeSettings.srate, rawPipeSettings.duration);
            channel.datasets[0].qual = standardDeviation(data.data[index])          
          }
        });

        return {
          ch0: rawData.ch0,
          ch1: rawData.ch1,
          ch2: rawData.ch2,
          ch3: rawData.ch3
        };
      });
    });

    window.multicastRaw$.connect();
    console.log("Subscribed to Raw");
  }
}

export function EEGEduRaw(channels) {
  function renderCharts() {
    return Object.values(channels.data).map((channel, index) => {
      const options = {
        ...generalOptions,
        scales: {
          xAxes: [
            {
              scaleLabel: {
                ...generalOptions.scales.xAxes[0].scaleLabel,
                labelString: specificTranslations.xlabel
              }
            }
          ],
          yAxes: [
            {
              scaleLabel: {
                ...generalOptions.scales.yAxes[0].scaleLabel,
                labelString: specificTranslations.ylabel
              },
              ticks: {
                max: 300,
                min: -300
              }
            }
          ]
        },
        elements: {
          line: {
            borderColor: 'rgba(' + channel.datasets[0].qual*10 + ', 128, 128)',
            fill: false
          },
          point: {
            radius: 0
          }
        },
        animation: {
          duration: 0
        },
        title: {
          ...generalOptions.title,
          text: generalTranslations.channel + channelNames[index] + ' --- SD: ' + channel.datasets[0].qual 
        }
      };

      return (
        <Card.Section key={"Card_" + index}>
          <Line key={"Line_" + index} data={channel} options={options} />
        </Card.Section>
      );
    });
  }

  return (
    <Card title={specificTranslations.title}>
      <Card.Section>
        <Stack>
          <TextContainer>
            <p>{specificTranslations.description}</p>
          </TextContainer>
        </Stack>
      </Card.Section>
      <Card.Section>
        <div style={chartStyles.wrapperStyle.style}>{renderCharts()}</div>
      </Card.Section>
    </Card>
  );
}


export function renderSlidersRaw(setRawData, status, rawPipeSettings, setRawPipeSettings) {
  function handleRawIntervalRangeSliderChange(value) {
    setRawPipeSettings(prevState => ({...prevState, interval: value}));
    buildPipeRaw(rawPipeSettings);
    setupRaw(setRawData, rawPipeSettings);
  }

  function handleRawCutoffLowRangeSliderChange(value) {
    setRawPipeSettings(prevState => ({...prevState, cutOffLow: value}));
    buildPipeRaw(rawPipeSettings);
    setupRaw(setRawData, rawPipeSettings);
  }

  function handleRawCutoffHighRangeSliderChange(value) {
    setRawPipeSettings(prevState => ({...prevState, cutOffHigh: value}));
    buildPipeRaw(rawPipeSettings);
    setupRaw(setRawData, rawPipeSettings);
  }

  function handleRawDurationRangeSliderChange(value) {
    setRawPipeSettings(prevState => ({...prevState, duration: value}));
    buildPipeRaw(rawPipeSettings);
    setupRaw(setRawData, rawPipeSettings);
  }

  return (
    <React.Fragment>
      <RangeSlider 
        disabled={status === generalTranslations.connect} 
        min={128} step={128}  max={4096} 
        label={'Epoch duration (Sampling Points): ' + rawPipeSettings.duration} 
        value={rawPipeSettings.duration} 
        onChange={handleRawDurationRangeSliderChange} 
      />          
      <RangeSlider 
        disabled={status === generalTranslations.connect} 
        min={10} step={5} max={rawPipeSettings.duration} 
        label={'Sampling points between epochs onsets: ' + rawPipeSettings.interval} 
        value={rawPipeSettings.interval} 
        onChange={handleRawIntervalRangeSliderChange} 
      />
      <RangeSlider 
        disabled={status === generalTranslations.connect} 
        min={.01} step={.5} max={rawPipeSettings.cutOffHigh - .5} 
        label={'Cutoff Frequency Low: ' + rawPipeSettings.cutOffLow + ' Hz'} 
        value={rawPipeSettings.cutOffLow} 
        onChange={handleRawCutoffLowRangeSliderChange} 
      />
      <RangeSlider 
        disabled={status === generalTranslations.connect} 
        min={rawPipeSettings.cutOffLow + .5} step={.5} max={rawPipeSettings.srate/2} 
        label={'Cutoff Frequency High: ' + rawPipeSettings.cutOffHigh + ' Hz'} 
        value={rawPipeSettings.cutOffHigh} 
        onChange={handleRawCutoffHighRangeSliderChange} 
      />
    </React.Fragment>
  )
}