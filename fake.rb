require 'csv'
require 'fileutils'

images = CSV.read("data/images.csv", headers: true)

images.each do |image|
  folder1 = File.dirname(image['path'])
  FileUtils.mkdir_p(folder1)
  `touch "#{image['path']}"`

  folder2 = File.dirname(image['thumb'])
  FileUtils.mkdir_p(folder2)
  `touch "#{image['thumb']}"`
end
