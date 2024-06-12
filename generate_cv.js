const data = require('./data');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const { dateDiff } = require('./lib/utils');

const totalYearsOfExperience = dateDiff('2013-10', new Date())

const doc = new PDFDocument();

doc.pipe(fs.createWriteStream('./static/files/geidelguerra_cv_en.pdf'));

doc.image('static/images/geidel_profile.jpg', 70, 20, { fit: [70, 70] })
doc.fillColor('#333333')
doc.fontSize(20).text('Geidel Guerra', 150, 30)
doc.moveDown(0.1)

data.networks.forEach((item, i) => {
  const notLast = i < data.networks.length - 1
  doc
    .fontSize(14)
    .text(item.label, { link: item.url, continued: notLast })
    .text('  ', { continued: notLast })
})

doc.text('', 70, 40)
doc.moveDown(5)

doc
  .fillColor('#333333')
  .font('assets/fonts/pdf/FiraSans-Black.ttf')
  .fontSize(18)
  .text('Who am I?')
  .moveDown(0.5)

doc
  .font('assets/fonts/pdf/FiraSans-Regular.ttf')
  .fontSize(12)
  .text(data.about, {wordSpacing: 0.5})

doc.moveDown()
doc.font('assets/fonts/pdf/FiraSans-Black.ttf').fontSize(18).text('Skills')

doc.moveDown(0.5)
doc.fillColor('#333333')
data.skills.forEach((item) => {
  doc
    .font('assets/fonts/pdf/FiraSans-Regular.ttf')
    .fontSize(12)
    .text(`${item.label}`, { link: item.url })
})

doc.moveDown()
doc.font('assets/fonts/pdf/FiraSans-Black.ttf').fontSize(18).text('Languages').moveDown(0.5)

data.languages.forEach((item) => {
  doc
    .font('assets/fonts/pdf/FiraSans-Regular.ttf')
    .fontSize(12)
    .text(`${item.label} - ${item.score}`, { link: item.url })
})

doc.moveDown()
doc.font('assets/fonts/pdf/FiraSans-Black.ttf').fontSize(18).text('Toolkit').moveDown(0.5)

data.toolkit.forEach((item) => {
  doc
    .font('assets/fonts/pdf/FiraSans-Regular.ttf')
    .fontSize(12)
    .text(`${item.category} - ${item.name}`)
})

doc.moveDown()
doc.font('assets/fonts/pdf/FiraSans-Black.ttf').fontSize(18).text(`Experience (${totalYearsOfExperience})`).moveDown(0.5)

data.experience.forEach((item) => {
  doc
    .font('assets/fonts/pdf/FiraSans-Bold.ttf')
    .fontSize(12)
    .text(item.name, { link: item.url })
    .font('assets/fonts/pdf/FiraSans-Regular.ttf')
    .fontSize(10)
    .text(item.company, { link: item.companyUrl })
    .fillColor('#888')
    .text(`${item.startDate} → ${item.endDate} (${dateDiff(item.startDate, item.endDate)})`)


  if (item.skills) {
    doc
      .fontSize(10)
      .fillColor('#888')
      .font('assets/fonts/pdf/FiraSans-Regular.ttf')
      .text(`Skills: ${item.skills.join(', ')}`)
  }

  doc.fillColor('#333333')
  doc.moveDown()
})

doc.moveDown()
doc.font('assets/fonts/pdf/FiraSans-Black.ttf').fontSize(18).text('Projects').moveDown(0.5)

data.projects.forEach((item) => {
  doc
    .font('assets/fonts/pdf/FiraSans-Bold.ttf')
    .fontSize(12)
    .text(item.name, { link: item.url })
    .font('assets/fonts/pdf/FiraSans-Regular.ttf')
    .fontSize(10)
    .fillColor('#888')
    .text(`${item.startDate} → ${item.endDate} (${dateDiff(item.startDate, item.endDate)})`)
    .fillColor('#333333')
    .moveDown(0.2)
    .fontSize(10)
    .font('assets/fonts/pdf/FiraSans-Regular.ttf')
    .text(item.description)
    .moveDown()
})

doc.save().end();