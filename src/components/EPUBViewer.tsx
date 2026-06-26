import React, {
    useEffect,
    useRef,
    useState
} from "react";

import ePub, {
    Book,
    Rendition
} from "epubjs";

import "../assets/styles/EPUBViewer.scss";


interface EPUBViewerProps {
    url: string | null;
    onClose: () => void;
}


// Simple cache so reopening books is faster
const epubCache = new Map<string, ArrayBuffer>();


function EPUBViewer({
    url,
    onClose
}: EPUBViewerProps) {

    const viewerRef = useRef<HTMLDivElement>(null);

    const bookRef = useRef<Book | null>(null);
    const renditionRef = useRef<Rendition | null>(null);


    const [loading,setLoading] = useState(true);
    const [error,setError] = useState<string | null>(null);
    const [title,setTitle] = useState("EPUB Viewer");


    useEffect(() => {

        if(!url)
            return;


        const originalOverflow =
            document.body.style.overflow;


        document.body.style.overflow = "hidden";


        const handleEsc = (e:KeyboardEvent)=>{

            if(e.key === "Escape"){
                onClose();
            }

        };


        window.addEventListener(
            "keydown",
            handleEsc
        );


        return ()=>{

            window.removeEventListener(
                "keydown",
                handleEsc
            );

            document.body.style.overflow =
                originalOverflow || "auto";

        };


    },[url,onClose]);



    useEffect(()=>{

        if(!url || !viewerRef.current)
            return;


        let cancelled = false;



        const cleanup = ()=>{

            try{
                renditionRef.current?.destroy();

            }catch{}

            try{
                bookRef.current?.destroy();

            }catch{}


            renditionRef.current = null;
            bookRef.current = null;

        };



        const loadBook = async()=>{

            try{

                setLoading(true);
                setError(null);


                let buffer =
                    epubCache.get(url);



                // Fetch only if not cached
                if(!buffer){

                    const response =
                        await fetch(url);


                    if(!response.ok)
                        throw new Error(
                            "Failed downloading EPUB"
                        );


                    buffer =
                        await response.arrayBuffer();


                    epubCache.set(
                        url,
                        buffer
                    );

                }



                if(cancelled)
                    return;



                const book =
                    ePub(buffer);


                bookRef.current = book;



                // Get metadata early
                try{

                    const metadata =
                        await book.loaded.metadata;


                    if(metadata.title){
                        setTitle(
                            metadata.title
                        );
                    }

                }catch{
                    console.log(
                        "Metadata unavailable"
                    );
                }




                const rendition =
                    book.renderTo(
                        viewerRef.current!,
                        {
                            width:"100%",
                            height:"100%",
                            spread:"none",
                            flow:"paginated"
                        }
                    );


                renditionRef.current =
                    rendition;



                await rendition.display();



                if(cancelled)
                    return;


                setLoading(false);



            }catch(err){

                console.error(
                    "EPUB loading error:",
                    err
                );


                if(!cancelled){

                    setError(
                        "Failed to load EPUB. The file may be unsupported."
                    );

                    setLoading(false);

                }

            }

        };



        loadBook();



        return ()=>{

            cancelled = true;

            cleanup();

        };


    },[url]);



    if(!url)
        return null;



    return (

        <div
            className="epub-viewer"
            onClick={onClose}
        >

            <div
                className="epub-window"
                onClick={
                    e=>e.stopPropagation()
                }
            >


                {/* TOP BAR */}

                <div className="epub-window-topbar">


                    <div className="window-left">


                        <div className="window-controls">

                            <span className="red"/>
                            <span className="yellow"/>
                            <span className="green"/>

                        </div>


                        <div className="window-title">

                            📖 {title}

                        </div>


                    </div>




                    <div className="window-actions">


                        <button
                            className="window-btn"
                            onClick={()=>
                                window.open(
                                    url,
                                    "_blank"
                                )
                            }
                        >
                            Download EPUB
                        </button>



                        <button
                            aria-label="Close EPUB viewer"
                            className="window-close"
                            onClick={onClose}
                        >
                            ×
                        </button>


                    </div>


                </div>





                {/* READER AREA */}

                <div className="epub-frame-wrapper">


                    <div
                        ref={viewerRef}
                        className="epub-rendition"
                    />



                    {
                        loading &&
                        <div className="viewer-loading">

                            <div className="loading-spinner"/>

                            <span>
                                Loading EPUB...
                            </span>

                        </div>
                    }



                    {
                        error &&
                        <div className="viewer-error">


                            <span className="error-icon">
                                ⚠️
                            </span>


                            <p>
                                {error}
                            </p>


                            <button
                                className="window-btn"
                                onClick={()=>
                                    window.open(
                                        url,
                                        "_blank"
                                    )
                                }
                            >
                                Download EPUB
                            </button>


                        </div>
                    }


                </div>


            </div>


        </div>

    );

}


export default EPUBViewer;