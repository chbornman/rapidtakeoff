#!/usr/bin/env bash
# Script to demonstrate editing SVG rendering parameters
# Run this script while the application is running to see the changes

CONFIG_FILE="$(pwd)/constants/component_renderer_config.json"
echo "Editing SVG configuration file: $CONFIG_FILE"

# Function to modify a JSON property in the svg section
modify_svg_property() {
  local property="$1"
  local new_value="$2"
  
  echo "Setting svg.$property to $new_value"
  
  # Use jq to update the SVG property
  jq ".svg.$property = $new_value" "$CONFIG_FILE" > "$CONFIG_FILE.tmp"
  # Replace the original file with the updated one
  mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"
  echo "SVG configuration updated. Watch the application for changes!"
  echo ""
}

# Function to modify a boolean property
modify_svg_bool() {
  local property="$1"
  local new_value="$2"  # Should be "true" or "false"
  
  echo "Setting svg.$property to $new_value"
  
  # Use jq to update the property
  if [ "$new_value" = "true" ]; then
    jq ".svg.$property = true" "$CONFIG_FILE" > "$CONFIG_FILE.tmp"
  else
    jq ".svg.$property = false" "$CONFIG_FILE" > "$CONFIG_FILE.tmp"
  fi
  
  # Replace the original file with the updated one
  mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"
  echo "SVG configuration updated. Watch the application for changes!"
  echo ""
}

# Main menu
while true; do
  echo "SVG Configuration Editor"
  echo "------------------------"
  echo "Choose an option:"
  echo "1. Change lineweight scaling (default: 1.0)"
  echo "2. Change minimum lineweight (default: 150.0)"
  echo "3. Change circle approximation count (default: 128)"
  echo "4. Change infinite line length (default: 20)"
  echo "5. Toggle show defpoints (default: false)"
  echo "6. Change custom background color"
  echo "7. Change custom foreground color"
  echo "8. Change color policy (COLOR, MONOCHROME)"
  echo "9. Exit"
  
  read -p "Enter your choice [1-9]: " choice
  echo ""
  
  case $choice in
    1) read -p "Enter new lineweight scaling [0.1-10.0]: " value
       modify_svg_property "lineweight_scaling" "$value" ;;
    2) read -p "Enter new minimum lineweight [10.0-300.0]: " value
       modify_svg_property "min_lineweight" "$value" ;;
    3) read -p "Enter new circle approximation count [16-256]: " value
       modify_svg_property "circle_approximation_count" "$value" ;;
    4) read -p "Enter new infinite line length [10-100]: " value
       modify_svg_property "infinite_line_length" "$value" ;;
    5) read -p "Show defpoints? [true/false]: " value
       modify_svg_bool "show_defpoints" "$value" ;;
    6) read -p "Enter new background color (hex, e.g. \"#ffffff\"): " value
       modify_svg_property "custom_bg_color" "\"$value\"" ;;
    7) read -p "Enter new foreground color (hex, e.g. \"#000000\"): " value
       modify_svg_property "custom_fg_color" "\"$value\"" ;;
    8) read -p "Color policy [COLOR, MONOCHROME]: " value
       modify_svg_property "color_policy" "\"$value\"" ;;
    9) echo "Exiting..."; exit 0 ;;
    *) echo "Invalid choice. Please try again." ;;
  esac
  
  # Wait a bit before showing the menu again
  sleep 2
done