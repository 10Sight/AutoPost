import React, { useEffect, useRef, useState } from "react";
import * as fabric from "fabric";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { 
    Type, 
    Smile, 
    Image as ImageIcon, 
    Trash2, 
    Download, 
    Save, 
    Undo, 
    Redo,
    Layers,
    Palette,
    Plus
} from "lucide-react";
import { ScrollArea } from "../../ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { Slider } from "../../ui/slider";

const ImageCanvasEditor = ({ imageUrl, onSave, onCancel }) => {
    const canvasRef = useRef(null);
    const fabricCanvasRef = useRef(null);
    const [selectedObject, setSelectedObject] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const canvas = new fabric.Canvas(canvasRef.current, {
            width: 800,
            height: 600,
            backgroundColor: "#f3f4f6"
        });
        fabricCanvasRef.current = canvas;

        fabric.Image.fromURL(imageUrl, { crossOrigin: "anonymous" }).then((img) => {
            // Resize canvas to image aspect ratio if needed, or scale image to fit
            const ratio = Math.min(800 / img.width, 600 / img.height);
            img.scale(ratio);
            canvas.centerObject(img);
            canvas.add(img);
            img.set("selectable", false);
            img.set("evented", false);
            canvas.renderAll();
        });

        canvas.on("selection:created", (e) => setSelectedObject(e.selected[0]));
        canvas.on("selection:updated", (e) => setSelectedObject(e.selected[0]));
        canvas.on("selection:cleared", () => setSelectedObject(null));

        return () => {
            canvas.dispose();
        };
    }, [imageUrl]);

    const addText = () => {
        const text = new fabric.IText("Type here...", {
            left: 100,
            top: 100,
            fontFamily: "Inter",
            fontSize: 40,
            fill: "#ffffff",
            fontWeight: "bold",
            stroke: "#000000",
            strokeWidth: 1
        });
        fabricCanvasRef.current.add(text);
        fabricCanvasRef.current.setActiveObject(text);
    };

    const addSticker = (emoji) => {
        const text = new fabric.Text(emoji, {
            left: 100,
            top: 100,
            fontSize: 80
        });
        fabricCanvasRef.current.add(text);
        fabricCanvasRef.current.setActiveObject(text);
    };

    const deleteSelected = () => {
        const activeObject = fabricCanvasRef.current.getActiveObject();
        if (activeObject) {
            fabricCanvasRef.current.remove(activeObject);
            fabricCanvasRef.current.discardActiveObject();
            fabricCanvasRef.current.renderAll();
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const dataUrl = fabricCanvasRef.current.toDataURL({
                format: "jpeg",
                quality: 0.9,
                multiplier: 2 // Higher resolution
            });
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            const file = new File([blob], "edited-image.jpg", { type: "image/jpeg" });
            await onSave(file);
        } catch (error) {
            console.error("Save failed:", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex h-full gap-4 p-4 overflow-hidden bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            {/* Toolbar */}
            <div className="w-64 flex flex-col gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <Tabs defaultValue="tools">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="tools">Tools</TabsTrigger>
                        <TabsTrigger value="style" disabled={!selectedObject}>Style</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="tools" className="space-y-4 mt-0">
                        <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" size="sm" onClick={addText} className="flex flex-col h-16 gap-1 border-dashed">
                                <Type className="h-4 w-4" />
                                <span className="text-[10px]">Add Text</span>
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => addSticker("🔥")} className="flex flex-col h-16 gap-1 border-dashed">
                                <Smile className="h-4 w-4" />
                                <span className="text-[10px]">Stickers</span>
                            </Button>
                        </div>

                        <div className="pt-4 border-t">
                            <Label className="text-xs font-semibold mb-2 block">Quick Stickers</Label>
                            <div className="flex flex-wrap gap-2">
                                {["❤️", "🚀", "✨", "💯", "✅", "⚠️"].map(s => (
                                    <button 
                                        key={s} 
                                        onClick={() => addSticker(s)}
                                        className="h-8 w-8 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-primary/10 transition-colors"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {selectedObject && (
                            <div className="pt-4 border-t space-y-2">
                                <Button variant="destructive" size="sm" className="w-full gap-2" onClick={deleteSelected}>
                                    <Trash2 className="h-4 w-4" /> Delete Object
                                </Button>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="style" className="space-y-4 mt-0">
                        {selectedObject && (
                            <>
                                <div className="space-y-2">
                                    <Label className="text-xs">Opacity</Label>
                                    <Slider 
                                        defaultValue={[selectedObject.opacity * 100]} 
                                        max={100} 
                                        step={1}
                                        onValueChange={([v]) => {
                                            selectedObject.set("opacity", v / 100);
                                            fabricCanvasRef.current.renderAll();
                                        }}
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label className="text-xs">Color</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {["#ffffff", "#000000", "#ef4444", "#3b82f6", "#22c55e", "#eab308"].map(c => (
                                            <button 
                                                key={c}
                                                className="h-6 w-6 rounded-full border border-gray-200"
                                                style={{ backgroundColor: c }}
                                                onClick={() => {
                                                    selectedObject.set("fill", c);
                                                    fabricCanvasRef.current.renderAll();
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </TabsContent>
                </Tabs>

                <div className="mt-auto space-y-2">
                    <Button className="w-full gap-2" onClick={handleSave} disabled={isSaving}>
                        <Save className="h-4 w-4" />
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button variant="ghost" className="w-full text-xs" onClick={onCancel}>
                        Cancel
                    </Button>
                </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 flex items-center justify-center bg-gray-200 dark:bg-gray-950 rounded-xl overflow-hidden shadow-inner border border-gray-300 dark:border-gray-800 relative">
                <canvas ref={canvasRef} className="shadow-2xl" />
                <div className="absolute bottom-4 right-4 flex gap-2">
                    <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full shadow-lg" onClick={() => fabricCanvasRef.current.zoomIn()}>
                        <Plus className="h-4 w-4" />
                    </Button>
                    {/* Simplified zoom/controls for production demo */}
                </div>
            </div>
        </div>
    );
};

export default ImageCanvasEditor;
