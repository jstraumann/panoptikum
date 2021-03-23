require 'csv'
require 'down'
require 'parallel'

csv_path = File.join(File.dirname(__FILE__), '../data/images.csv')
csv = CSV.read(csv_path, headers: true)

csv.each do |image|
  file_rel_path = image['path']
  file_path = File.join(File.dirname(__FILE__), '..', file_rel_path)
  folder_name = file_rel_path.split('/')[1]
  subfolder_path = File.join(File.dirname(__FILE__), '..', "images/#{folder_name}")
  if !File.exists?(file_path)
    puts "D #{image['Nummer']}"
    begin
      tempfile = Down.download("https://archiv.juergstraumann.ch/#{file_rel_path}")
      Dir.mkdir(subfolder_path) unless File.exists?(subfolder_path)
      FileUtils.mv(tempfile.path, file_path)
    rescue => e
      puts "E #{file_path}"
    end
  else
    puts "S #{image['Nummer']}"
  end
end
puts