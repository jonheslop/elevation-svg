#!/usr/bin/env node
'use strict';

const meow = require('meow');
const imagemin = require('imagemin');
const imageminSVGO = require('imagemin-svgo');
const fs = require('fs')

const cli = meow(`
  Usage
    $ foo <input>

  Options
    --input, -i  input filename
    --output, -o  output filename
    --distance, -d  input file
  `, {
    flags: {
      input: {
        type: 'string',
        alias: 'i'
      },
      output: {
        type: 'string',
        alias: 'o'
      },
      distance: {
        type: 'string',
        alias: 'd'
      }
    }
  })

const getSource = filename => {
  const points = JSON.parse(fs.readFileSync(filename, 'utf8'))
  return {
    points,
    size: points.elevation.length
  }
}

// If we wanted to join multiple rides we’d want them all the be
// relative to each other so need each other so setting absolute max
const maxElevation = 3000

const build = (input, distance) => {
  const data = getSource(input)
  // GPX files are big so only sample 250 points per 100km
  const sampleRate = Math.round(data.size / (250 * (distance / 100)))
  console.log('Total points:', data.size)
  console.log('Sample rate:', sampleRate)
  const sample = data.points.elevation.filter((point, index) =>  index % sampleRate === 0)
  const points = sample.map((point, index) => {
    return `${index} ${((maxElevation - point) / 30).toFixed(2)}`
  })

  return `<svg
    xmlns="http://www.w3.org/2000/svg"
    width="${distance * 2.5}"
    height="${maxElevation/30}"
    viewBox="0 0 ${distance * 2.5} ${maxElevation/30}"
    title="Cent Cols elevation data">
      <polyline
        stroke="red"
        fill="none"
        points="${points.toString()}"
      />
    </svg>`
}

const makeSVG = async ({ input, output, distance }) => {
  await fs.writeFileSync(`img/${output}.svg`, build(input, distance), err => {
      if (err) return console.error (err)
  })

  await imagemin(
    ['img/*.svg'],
    'img', {
      plugins: [imageminSVGO()]
    }
  )
  return console.log(`${output}.svg generated successfully`)
}

makeSVG(cli.flags)
